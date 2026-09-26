import os
import sys
from PIL import Image
import torch
from torchvision import transforms, models
from ultralytics import YOLO

sys.path.insert(0, os.path.abspath('.'))
sys.path.insert(0, os.path.abspath('backend'))

from backend.ai_engine.stage1_gatekeeper import Stage1Gatekeeper
from backend.ai_engine.stage2_detector import Stage2Detector

img_path = 'Medical waste detection/CleanTrack_Image_Scanner/1_DROP_IMAGES_HERE/sample_1_syringe.jpg'
img = Image.open(img_path).convert('RGB')

print("1. Testing Stage 1 Gatekeeper:")
gatekeeper = Stage1Gatekeeper()
s1_res = gatekeeper.evaluate(img)
print("  Gatekeeper result:", s1_res)

print("\n2. Testing Stage 2 YOLO Detector:")
s2 = Stage2Detector()
s2_res = s2.detect(img)
print("  Stage 2 detections:", len(s2_res['detections']), s2_res['detections'])

print("\n3. Testing Medical Waste New Model (best_medical_classifier.pth):")
med_model_path = 'Medical Waste New Model/best_medical_classifier.pth'
checkpoint = torch.load(med_model_path, map_location='cpu', weights_only=False)
classes = checkpoint['classes']
classifier = models.efficientnet_b0(weights=None)
classifier.classifier[1] = torch.nn.Linear(classifier.classifier[1].in_features, len(classes))
classifier.load_state_dict(checkpoint['model_state_dict'])
classifier.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])
tensor = transform(img).unsqueeze(0)
with torch.no_grad():
    output = classifier(tensor)
    probs = torch.softmax(output, dim=1)[0]
top_values, top_indices = torch.topk(probs, 5)
for v, idx in zip(top_values, top_indices):
    print(f"  {classes[idx.item()]}: {v.item()*100:.2f}%")
