import os
import json
import hashlib
import shutil
import random
from collections import defaultdict
from PIL import Image

random.seed(42)

# Paths
taco_ann_file = 'datasets/taco/annotations.json'
taco_img_dir = 'datasets/taco/images'
trashnet_dir = 'datasets/trashnet/dataset-resized'
out_dir = os.path.abspath('datasets/unified_plastic_dataset')

# Ensure output dirs exist
for split in ['train', 'val', 'test']:
    os.makedirs(os.path.join(out_dir, 'images', split), exist_ok=True)
    os.makedirs(os.path.join(out_dir, 'labels', split), exist_ok=True)

# 8 Master Classes matching best.pt
NAMES = {
    0: 'pet',
    1: 'pead',
    2: 'mixed_plastic_soft',
    3: 'ecal',
    4: 'metal',
    5: 'cardboard',
    6: 'mixed_plastic_rigid',
    7: 'pet_oleo'
}

# TACO Category ID to Master Class ID mapping
TACO_MAP = {
    # 0: pet
    5: 0,   # Clear plastic bottle
    4: 0,   # Other plastic bottle
    
    # 2: mixed_plastic_soft
    36: 2,  # Plastic film
    39: 2,  # Other plastic wrapper
    40: 2,  # Single-use carrier bag
    41: 2,  # Polypropylene bag
    42: 2,  # Crisps packet
    37: 2,  # Six pack rings
    38: 2,  # Garbage bag
    
    # 3: ecal
    16: 3,  # Drink carton
    15: 3,  # Meal carton
    
    # 4: metal
    12: 4,  # Drink can
    11: 4,  # Food can
    0: 4,   # Aluminium foil
    8: 4,   # Metal bottle cap
    1: 4,   # Aerosol
    50: 4,  # Pop tab
    
    # 5: cardboard
    17: 5,  # Corrugated carton
    14: 5,  # Other carton
    18: 5,  # Egg carton
    
    # 6: mixed_plastic_rigid
    7: 6,   # Plastic bottle cap
    27: 6,  # Plastic lid
    21: 6,  # Disposable plastic cup
    22: 6,  # Other plastic cup
    24: 6,  # Plastic container
    26: 6,  # Disposable food container
    29: 6,  # Other plastic
    57: 6,  # Styrofoam piece
    55: 6,  # Plastic straw
    25: 6,  # Plastic gloves
    28: 6,  # Plastic utensils
    43: 6,  # Spread tub
    44: 6,  # Tupperware
}

print('Loading TACO annotations...')
with open(taco_ann_file, 'r', encoding='utf-8') as f:
    taco_data = json.load(f)

# Group annotations by image_id
ann_by_image = defaultdict(list)
for ann in taco_data['annotations']:
    ann_by_image[ann['image_id']].append(ann)

taco_images = {img['id']: img for img in taco_data['images']}

seen_hashes = set()
corrupt_images = 0
invalid_boxes = 0
valid_items = []
class_counts = defaultdict(int)

print('Processing and validating TACO images...')
for img_id, img_info in taco_images.items():
    rel_path = img_info['file_name']
    full_img_path = os.path.join(taco_img_dir, rel_path)
    
    if not os.path.exists(full_img_path) or os.path.getsize(full_img_path) < 100:
        corrupt_images += 1
        continue
        
    try:
        with Image.open(full_img_path) as im:
            im.verify()
        with Image.open(full_img_path) as im:
            w, h = im.size
            if w < 32 or h < 32:
                corrupt_images += 1
                continue
    except Exception:
        corrupt_images += 1
        continue
        
    # Deduplicate via MD5
    with open(full_img_path, 'rb') as f:
        md5 = hashlib.md5(f.read()).hexdigest()
    if md5 in seen_hashes:
        continue
    seen_hashes.add(md5)
    
    # Process annotations for this image
    raw_anns = ann_by_image.get(img_id, [])
    yolo_boxes = []
    for ann in raw_anns:
        cid = ann['category_id']
        if cid not in TACO_MAP:
            continue
        mapped_cls = TACO_MAP[cid]
        bbox = ann.get('bbox')
        if not bbox or len(bbox) != 4:
            invalid_boxes += 1
            continue
        bx, by, bw, bh = bbox
        if bw <= 1 or bh <= 1:
            invalid_boxes += 1
            continue
            
        cx = (bx + bw / 2.0) / float(w)
        cy = (by + bh / 2.0) / float(h)
        nw = float(bw) / float(w)
        nh = float(bh) / float(h)
        
        # Clamp coordinates
        cx = max(0.001, min(0.999, cx))
        cy = max(0.001, min(0.999, cy))
        nw = max(0.001, min(1.0, nw))
        nh = max(0.001, min(1.0, nh))
        
        yolo_boxes.append((mapped_cls, cx, cy, nw, nh))
        class_counts[mapped_cls] += 1
        
    valid_items.append({
        'src_path': full_img_path,
        'prefix': f'taco_{img_id:05d}',
        'boxes': yolo_boxes,
        'is_negative': len(yolo_boxes) == 0,
        'source': 'TACO'
    })

print(f'TACO processed: {len(valid_items)} valid images ({sum(1 for x in valid_items if not x["is_negative"])} positive, {sum(1 for x in valid_items if x["is_negative"])} negative background).')

# Ingest Negative Samples from TrashNet (glass, paper, trash) to suppress False Positives
print('Ingesting negative samples from TrashNet...')
trashnet_negatives = []
for neg_folder, max_samples in [('glass', 75), ('paper', 75), ('trash', 50)]:
    folder_path = os.path.join(trashnet_dir, neg_folder)
    if os.path.exists(folder_path):
        fnames = [f for f in os.listdir(folder_path) if f.endswith(('.jpg', '.jpeg', '.png'))]
        random.shuffle(fnames)
        for fname in fnames[:max_samples]:
            fpath = os.path.join(folder_path, fname)
            try:
                with Image.open(fpath) as im:
                    im.verify()
                with open(fpath, 'rb') as f:
                    md5 = hashlib.md5(f.read()).hexdigest()
                if md5 in seen_hashes:
                    continue
                seen_hashes.add(md5)
                trashnet_negatives.append({
                    'src_path': fpath,
                    'prefix': f'trashnet_{neg_folder}_{os.path.splitext(fname)[0]}',
                    'boxes': [],
                    'is_negative': True,
                    'source': 'TrashNet'
                })
            except Exception:
                continue

print(f'TrashNet negatives added: {len(trashnet_negatives)} images.')
all_items = valid_items + trashnet_negatives
random.shuffle(all_items)

# Leakage-Free 70% Train / 15% Val / 15% Test Split
n_total = len(all_items)
n_train = int(n_total * 0.70)
n_val = int(n_total * 0.15)
n_test = n_total - n_train - n_val

splits = {
    'train': all_items[:n_train],
    'val': all_items[n_train:n_train+n_val],
    'test': all_items[n_train+n_val:]
}

print(f'Splits created: Train={len(splits["train"])}, Val={len(splits["val"])}, Test={len(splits["test"])}')

split_stats = {}
for s_name, s_items in splits.items():
    pos_count = 0
    neg_count = 0
    box_count = 0
    for it in s_items:
        ext = os.path.splitext(it['src_path'])[1].lower()
        dst_img = os.path.join(out_dir, 'images', s_name, f"{it['prefix']}{ext}")
        dst_txt = os.path.join(out_dir, 'labels', s_name, f"{it['prefix']}.txt")
        
        shutil.copy2(it['src_path'], dst_img)
        
        with open(dst_txt, 'w', encoding='utf-8') as lf:
            for b in it['boxes']:
                lf.write(f"{b[0]} {b[1]:.6f} {b[2]:.6f} {b[3]:.6f} {b[4]:.6f}\n")
                box_count += 1
                
        if it['is_negative']:
            neg_count += 1
        else:
            pos_count += 1
            
    split_stats[s_name] = {'total': len(s_items), 'pos': pos_count, 'neg': neg_count, 'boxes': box_count}

# Write dataset.yaml
norm_out_dir = out_dir.replace('\\', '/')
yaml_content = f"""# CleanTrack Unified Multi-Source Plastic Detection Dataset
path: {norm_out_dir}
train: images/train
val: images/val
test: images/test

nc: 8
names:
  0: 'pet'
  1: 'pead'
  2: 'mixed_plastic_soft'
  3: 'ecal'
  4: 'metal'
  5: 'cardboard'
  6: 'mixed_plastic_rigid'
  7: 'pet_oleo'
"""
with open(os.path.join(out_dir, 'dataset.yaml'), 'w', encoding='utf-8') as yf:
    yf.write(yaml_content)

# Save json manifest of dataset stats for reports
manifest = {
    'total_images': n_total,
    'splits': split_stats,
    'class_distribution': {NAMES[cid]: class_counts[cid] for cid in range(8)},
    'corrupt_filtered': corrupt_images,
    'invalid_boxes_filtered': invalid_boxes,
    'negative_background_ratio': sum(st['neg'] for st in split_stats.values()) / float(n_total)
}
with open(os.path.join(out_dir, 'manifest.json'), 'w', encoding='utf-8') as jf:
    json.dump(manifest, jf, indent=2)

print('Dataset YAML and manifest written successfully!')
print('=== DATASET GENERATION SUMMARY ===')
print(f'Total Unified Images: {n_total}')
for s_name, st in split_stats.items():
    print(f'  Split {s_name.upper():5s}: {st["total"]:4d} images ({st["pos"]:4d} positive, {st["neg"]:3d} negative, {st["boxes"]:4d} bounding boxes)')
print('\nClass distribution across bounding boxes:')
for cid in range(8):
    print(f'  Class {cid} ({NAMES[cid]:18s}): {class_counts[cid]:4d} instances')
print(f'Corrupt images filtered: {corrupt_images}')
print(f'Invalid/Degenerate boxes filtered: {invalid_boxes}')
