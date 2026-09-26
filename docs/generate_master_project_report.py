import os
import sys
import time
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable, PageBreak
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and render exact total page counts,
    along with professional running headers and footers.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        # Suppress running headers/footers on page 1 (Cover Page)
        if self._pageNumber == 1:
            return

        self.saveState()
        
        # Running Top Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0f766e"))
        self.drawString(54, 804, "CleanTrack")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(102, 804, "- AI-Powered Civic Cleanliness & Waste Intelligence Operating System")
        self.drawRightString(541, 804, "Master Technical Project Report")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(54, 796, 541, 796)

        # Running Bottom Footer
        self.line(54, 44, 541, 44)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 32, "Smart India Hackathon (SIH) Technical Submission | CleanTrack Platform")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(541, 32, page_text)
        
        self.restoreState()


def build_pdf(filename="CleanTrack_Master_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Palette definition
    PRIMARY = colors.HexColor("#0f766e")       # Deep Teal
    PRIMARY_DARK = colors.HexColor("#115e59")  # Dark Teal
    PRIMARY_LIGHT = colors.HexColor("#f0fdfa") # Teal Tint
    SECONDARY = colors.HexColor("#1e293b")     # Slate Dark
    ACCENT_BLUE = colors.HexColor("#0284c7")   # Ocean Blue
    ACCENT_AMBER = colors.HexColor("#d97706")  # Amber Alert
    ACCENT_GREEN = colors.HexColor("#16a34a")  # Emerald Green
    BORDER_COLOR = colors.HexColor("#cbd5e1")  # Slate Border
    BG_LIGHT = colors.HexColor("#f8fafc")      # Off-white / light slate
    TEXT_DARK = colors.HexColor("#0f172a")     # Very dark slate
    TEXT_MUTED = colors.HexColor("#475569")    # Muted slate

    # Typography Styles
    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=23,
        leading=28,
        textColor=PRIMARY,
        spaceAfter=8
    )
    
    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=15,
        textColor=SECONDARY,
        spaceAfter=12
    )

    cover_meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=13.5,
        textColor=TEXT_MUTED
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15.5,
        textColor=PRIMARY,
        spaceBefore=11,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.2,
        leading=12.5,
        textColor=SECONDARY,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11.5,
        textColor=PRIMARY_DARK,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.8,
        textColor=TEXT_DARK,
        leftIndent=10,
        spaceAfter=2
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=TEXT_DARK
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold'
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=11,
        textColor=colors.HexColor("#1e3a8a")
    )

    callout_green = ParagraphStyle(
        'CalloutGreen',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=11,
        textColor=colors.HexColor("#14532d")
    )

    story = []

    # =========================================================================
    # COVER PAGE (PAGE 1)
    # =========================================================================
    story.append(Spacer(1, 15))
    
    cover_box_data = [
        [
            Paragraph("<b>SMART INDIA HACKATHON (SIH) TECHNICAL PROJECT SUBMISSION</b>", 
                      ParagraphStyle('CoverBadge', fontName='Helvetica-Bold', fontSize=9, textColor=PRIMARY, backColor=PRIMARY_LIGHT, spaceAfter=4))
        ],
        [
            Paragraph("CleanTrack: AI-Powered Civic Cleanliness &amp; Waste Intelligence Operating System", cover_title_style)
        ],
        [
            Paragraph(
                "A Production-Grade, Closed-Loop Urban Cleanliness Platform Connecting Citizens, Field Sanitation Squads, "
                "and Municipal Authorities with Multi-Class Computer Vision (Plastics, Biomedical Sharps &amp; E-Waste), "
                "Automated SLA Enforcement, 50-Meter Geospatial Duplicate Clustering, and Civic Gamification.",
                cover_subtitle_style
            )
        ],
        [
            HRFlowable(width="100%", thickness=2, color=PRIMARY, spaceBefore=4, spaceAfter=8)
        ],
        [
            Paragraph(
                "<b>Project Codebase:</b> CleanTrack Enterprise Web Platform (SIH_website)<br/>"
                "<b>Architecture Paradigm:</b> 3-Tier Enterprise MVC &bull; Asynchronous Micro-Services &bull; Multi-Stage Deep Learning Pipeline<br/>"
                "<b>Production Stack:</b> React 19, Vite 8, Tailwind CSS, Leaflet GIS, Recharts, Node.js, Express.js, MongoDB Geospatial, YOLOv8/YOLO11, Socket.io<br/>"
                "<b>Statutory Alignment:</b> Swachh Bharat Mission (Urban 2.0), CPCB Solid &amp; Biomedical Waste Management Rules (2016/2018), Smart Cities Mission<br/>"
                "<b>Document Scope:</b> Comprehensive Technical Report &bull; Developed Features Audit &bull; High-Impact Roadmap Blueprint",
                cover_meta_style
            )
        ]
    ]

    cover_table = Table(cover_box_data, colWidths=[487])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1.5, PRIMARY),
        ('PADDING', (0,0), (-1,-1), 14),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 14))

    # Executive Overview Callout on Cover
    exec_callout_data = [[
        Paragraph(
            "<b>CORE HIGHLIGHTS &amp; ARCHITECTURAL SUMMARY:</b><br/>"
            "&bull; <b>1. Multi-Class Deep Learning:</b> Real-time detection across Plastics, Biomedical Sharps, E-Waste, Paper, Metal, Glass, Textiles, and Organic matter.<br/>"
            "&bull; <b>2. 3-Step Guided Citizen Reporting:</b> Sub-30 second grievance filing with GPS auto-detection, reverse ward geocoding, and live AI scanning HUD.<br/>"
            "&bull; <b>3. 5-Factor AI Priority Scoring:</b> Automated 0-100 severity scoring eliminating manual backlog triage.<br/>"
            "&bull; <b>4. 50-Meter Haversine Duplicate Clustering:</b> Sub-millisecond spatial deduplication via MongoDB <code>2dsphere</code> indexing.<br/>"
            "&bull; <b>5. Background SLA Watchdog &amp; Auto-Escalation:</b> Continuous <code>node-cron</code> engine auto-escalating overdue tickets to CRITICAL.<br/>"
            "&bull; <b>6. Photographic Proof-of-Work &amp; Before/After Slider:</b> Citizen visual audit with split-screen comparison slider &amp; Green Points rewards.<br/>"
            "&bull; <b>7. Dedicated Worker Panel (Roadmap):</b> Mobile-first field app with turn-by-turn navigation, digital PPE safety check-in, and 30m geo-fenced camera.<br/>"
            "&bull; <b>8. Degradable vs. Biodegradable AI (Roadmap):</b> Wet/dry segregation quality index, organic composting yield math, and methane prevention model.",
            callout_style
        )
    ]]
    exec_callout_table = Table(exec_callout_data, colWidths=[487])
    exec_callout_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#bfdbfe")),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(exec_callout_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: EXECUTIVE SUMMARY & PROBLEM STATEMENT (PAGE 2)
    # =========================================================================
    story.append(Paragraph("1. Executive Summary &amp; Urban Sanitation Context", h1_style))
    story.append(Paragraph(
        "Rapid urbanization across Indian municipalities has triggered an unprecedented surge in municipal solid waste generation. "
        "Municipalities face five core structural bottlenecks in existing grievance redressal platforms (such as the legacy Swachhata App or municipal web portals):",
        body_style
    ))

    problems = [
        ("Unstructured & Ambiguous Grievance Data:", "Citizens upload unverified, blurred, or text-only complaints lacking exact geolocation coordinates or waste material classification, leaving municipal supervisors blind to required containment gear."),
        ("Hazardous Co-Mingling of Biohazards & E-Waste:", "Highly infectious clinical sharps (syringes, hypodermic needles, blood-contaminated gauze) and hazardous electronic scrap (lithium batteries, heavy metals) are frequently dumped into open municipal dumpsters, creating severe bio-infection and toxin risks for sanitation workers."),
        ("Ghost & Redundant Crew Dispatches:", "Multiple citizens in high-density areas report the same garbage pile. Without spatial clustering, multiple municipal trucks are dispatched to the identical spot, squandering civic fuel and manpower."),
        ("Unmonitored Service Level Agreements (SLAs):", "Complaints languish in bureaucratic queues without automated time-decay escalation, leading to public dissatisfaction and pest infestation."),
        ("Lack of Ground-Level Verification:", "Contractors mark tickets as 'Resolved' without photographic evidence, leading to fraudulent ticket closures and citizen distrust.")
    ]

    for p_title, p_desc in problems:
        story.append(Paragraph(f"&bull; <b>{p_title}</b> {p_desc}", bullet_style))

    story.append(Spacer(1, 3))
    story.append(Paragraph(
        "<b>CleanTrack</b> solves these challenges through a unified, closed-loop urban cleanliness operating system that bridges citizens, "
        "field sanitation squads, and municipal authorities with real-time deep learning computer vision, automated SLA background escalation, "
        "and geospatial intelligence.",
        body_style
    ))

    # Closed-Loop Diagram Box
    lifecycle_data = [[
        Paragraph(
            "<b>The Closed-Loop Cleanliness Lifecycle:</b><br/>"
            "<b>Step 1 [Citizen Capture]:</b> Citizen shoots photo via mobile/web with automated HTML5 GPS geolocation.<br/>"
            "<b>Step 2 [AI Vision Scan]:</b> Dual YOLO neural models detect waste categories (Plastic, Biomedical, E-Waste), bounding boxes, coverage %, and volume/mass.<br/>"
            "<b>Step 3 [Spatial Deduplication]:</b> MongoDB 2dsphere index executes 50m Haversine query to cluster redundant reports.<br/>"
            "<b>Step 4 [Automated Triage]:</b> 5-Factor AI priority algorithm assigns 0-100 severity and sets dynamic SLA deadlines (12h, 24h, 48h).<br/>"
            "<b>Step 5 [Squad Dispatch]:</b> Municipal command center dispatches specialized squad (Compactor / Biohazard / E-Waste) with PPE checklist.<br/>"
            "<b>Step 6 [Field Cleanup]:</b> Sanitation squad clears site and uploads mandatory on-site 'After' photograph.<br/>"
            "<b>Step 7 [Citizen Verification]:</b> Citizen validates cleanup using interactive Before/After drag slider, unlocking Green Points rewards.",
            callout_style
        )
    ]]
    lifecycle_table = Table(lifecycle_data, colWidths=[487])
    lifecycle_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdfa")),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(lifecycle_table)
    story.append(Spacer(1, 5))

    # =========================================================================
    # SECTION 2: SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("2. Enterprise System Architecture", h1_style))
    story.append(Paragraph(
        "CleanTrack is built upon a decoupled 3-tier enterprise architecture engineered for high concurrency, sub-second reactivity, "
        "and strict security boundaries:",
        body_style
    ))

    arch_layers = [
        ("Presentation Layer (Client-Side SPA):", "Built with React 19 and Vite 8, featuring utility-first responsive styling via Tailwind CSS, Leaflet GIS mapping, Recharts data visualization, and canvas-confetti particle animations. Organized into 4 distinct layout zones: Public Informational routes, Citizen Portal, Municipal Staff Triage Center, and Executive Administration Dashboard."),
        ("Business & Application Layer (Node.js & Express REST API):", "A modular MVC architecture with dedicated controllers, robust middleware chaining (JWT authentication, Role-Based Access Control, Multer file handling, Helmet security headers, rate limiting), and specialized services (aiService, escalationService, rewardService, notificationService)."),
        ("Real-Time Event & Background Worker Infrastructure:", "Socket.io WebSocket server providing instantaneous bi-directional event broadcasts (new tickets, SLA breaches, status updates). Background node-cron scheduler executing continuous 60-second SLA watchdog routines."),
        ("Data Persistence Layer (MongoDB & Mongoose ODM):", "Document-oriented database utilizing 10 structured schemas with relational ObjectIds and 2dsphere spherical geometry indexes for sub-millisecond spatial queries."),
        ("Deep Learning Inference Subsystem (Ultralytics YOLO & PyTorch):", "A multi-stage Python computer vision pipeline combining a Fast MobileNetV3 Scene Gatekeeper with dual fine-tuned YOLOv8/YOLO11 neural networks, Non-Maximum Suppression (NMS), IoU deduplication, and physical volumetric math.")
    ]

    for a_title, a_desc in arch_layers:
        story.append(Paragraph(f"&bull; <b>{a_title}</b> {a_desc}", bullet_style))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 3: MASTER FEATURE CATALOG - PART 1 (OPERATIONAL & DEVELOPED) (PAGE 3 & 4)
    # =========================================================================
    story.append(Paragraph("3. Master Feature Catalog - Operational Features (Already Developed)", h1_style))
    story.append(Paragraph(
        "The following capabilities are fully engineered, tested, and operational within the CleanTrack codebase:",
        body_style
    ))

    # Feature 1
    f1_items = [
        ("Dual-Model Neural Network Ensemble:", "Orchestrates specialized YOLOv8/YOLO11 models (<code>plastic_best.pt</code>, <code>biomedical_best.pt</code>, and <code>ewaste_best.pt</code>) for instantaneous multi-object detection in ~140ms."),
        ("25+ Material Classes Detected:", "Identifies PET bottles, HDPE containers, LDPE films, PP rigid items, clinical syringes, hypodermic needles, surgical gloves, face masks, gauze bandages, vacutainer test tubes, batteries, electronic circuit scrap, keyboards, appliances, and organic wet waste."),
        ("Bounding Boxes & Confidence Scores:", "Computes exact pixel coordinates, category labels, and detection confidence percentages for every identified object."),
        ("CPCB & WHO Statutory Segregation Streams:", "Automatically maps detected refuse to statutory regulatory streams: Yellow (CBWTF Incineration), Red (Autoclaving), Blue (Dry Recycling), Grey (E-Waste EPR Recycler), Green (Composting), and Black (Non-hazardous Landfill)."),
        ("Physical Sizing & Volumetric Estimation Math:", "Mathematical algorithms computing estimated volume (Liters, m³) and mass (grams, kg) with matching municipal container requirements (e.g., 0.5L puncture-proof sharps box vs 50L compactor tipper)."),
        ("Stage 1 Fast Scene Gatekeeper:", "MobileNetV3 heuristics evaluating image context in <30ms, immediately rejecting clean rooms, desks, beds, selfies, or non-waste scenes without invoking heavy GPU/CPU models.")
    ]
    f1_box = [Paragraph("<b>Feature 1: Multi-Class Deep Learning Waste Detection (Plastics, Medical &amp; E-Waste)</b>", h2_style)]
    for it_title, it_desc in f1_items:
        f1_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f1_box))
    story.append(Spacer(1, 3))

    # Feature 2
    f2_items = [
        ("3-Step Guided Reporting Wizard:", "Streamlined workflow: (1) Photo Capture/Upload &rarr; (2) Instant AI Analysis &rarr; (3) Location Pinpoint &amp; Submission."),
        ("1-Click Testing Sample Suite:", "Pre-loaded high-resolution benchmark samples (Plastic dump, Biohazard sharps, Surgical PPE, Electronics) for immediate hackathon demonstration."),
        ("Interactive Animated AI Scanning HUD:", "Dynamic scanning laser overlay providing futuristic visual feedback while the neural network processes the image."),
        ("Interactive Leaflet Location Picker:", "Draggable coordinate pin with automated HTML5 GPS browser geolocation and reverse geocoding to municipal ward numbers and landmarks.")
    ]
    f2_box = [Paragraph("<b>Feature 2: Citizen Reporting &amp; 3-Step Guided Wizard</b>", h2_style)]
    for it_title, it_desc in f2_items:
        f2_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f2_box))
    story.append(Spacer(1, 3))

    # Feature 3
    f3_items = [
        ("Visual Step-by-Step Ticket Tracker:", "Comprehensive progress bar tracking tickets across 5 distinct stages: Submitted &rarr; AI Triaged &rarr; Squad Dispatched &rarr; In Progress &rarr; Completed &rarr; Verified."),
        ("Assigned Squad & Supervisor Details:", "Displays assigned sanitation unit name (e.g. Squad Bravo - Biohazard Unit), vehicle details, and direct contact numbers."),
        ("Interactive Grievance Management Center:", "Searchable grievance table with status filters (Pending, Dispatched, In Progress, Resolved) and dynamic priority badges.")
    ]
    f3_box = [Paragraph("<b>Feature 3: Citizen Complaint Tracking &amp; Lifecycle Management</b>", h2_style)]
    for it_title, it_desc in f3_items:
        f3_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f3_box))
    story.append(Spacer(1, 3))

    # Feature 4
    f4_items = [
        ("5-Factor Mathematical AI Priority Formula:", "Automated 0-100 scoring based on Waste Type Hazard (30%), Visual Extent (30%), Location Sensitivity (25%), Chronic Recurrence (10%), and Time Elapsed (5%)."),
        ("Dynamic Priority Tiers:", "Automatically classifies complaints into Low (0-29), Medium (30-59), High (60-79), and Critical (80-100) tiers."),
        ("Biohazard Hazard Weighting:", "Clinical sharps immediately trigger a 30-point hazard weight, ensuring urgent operational response.")
    ]
    f4_box = [Paragraph("<b>Feature 4: Intelligent Complaint Prioritization using AI</b>", h2_style)]
    for it_title, it_desc in f4_items:
        f4_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f4_box))
    story.append(Spacer(1, 3))

    # Feature 5
    f5_items = [
        ("Time-Based SLA Deadlines:", "Calculates resolution deadlines dynamically from SystemSetting: Critical = 12 Hours, Medium = 24 Hours, Normal = 48 Hours."),
        ("Background SLA Watchdog Cron:", "Continuous background worker (<code>node-cron</code> running every 60s) continuously evaluating all active tickets."),
        ("Automated Escalation & Alarms:", "When <code>dueAt &lt; NOW</code>, unresolved complaints automatically escalate to <b>CRITICAL</b>, append priority history, record an audit log, and push emergency alarms via WebSockets."),
        ("Admin Manual Escalation Trigger:", "Dedicated HTTP testing endpoint (<code>POST /api/admin/test/escalate/:id</code>) for instant demonstration of SLA mechanics.")
    ]
    f5_box = [Paragraph("<b>Feature 5: Automated SLA &amp; Background Escalation Engine</b>", h2_style)]
    for it_title, it_desc in f5_items:
        f5_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f5_box))
    story.append(Spacer(1, 3))

    # Feature 6
    f6_items = [
        ("50-Meter Haversine Spatial Deduplication:", "MongoDB <code>2dsphere</code> indexing (<code>$geoNear</code>) identifying redundant reports within a 50m radius."),
        ("Master Ticket Clustering:", "Merges duplicate submissions into a parent master ticket, aggregating citizen upvotes without dispatching duplicate sanitation trucks."),
        ("Fuel & Fleet Savings:", "Eliminates redundant vehicle trips, cutting municipal diesel expenditure and reducing urban congestion.")
    ]
    f6_box = [Paragraph("<b>Feature 6: Geospatial Duplicate Detection &amp; Spatial Clustering</b>", h2_style)]
    for it_title, it_desc in f6_items:
        f6_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f6_box))
    story.append(PageBreak())

    # Feature 7 (PAGE 4)
    f7_items = [
        ("Interactive Leaflet GIS Heatmaps:", "Ward maps displaying color-coded severity heat zones, circular radius overlays, and active problem clusters."),
        ("Chronic Recurring Waste Detection:", "Automatically detects repeat dump sites (&ge; 3 complaints within 14 days), computing recurrence level and root-cause inferences."),
        ("Citizen Public Hotspots View:", "Publicly accessible city map keeping citizens informed of neighborhood waste hotspots and community cleanups.")
    ]
    f7_box = [Paragraph("<b>Feature 7: GIS Hotspot Detection &amp; Chronic Recurrence Analytics</b>", h2_style)]
    for it_title, it_desc in f7_items:
        f7_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f7_box))
    story.append(Spacer(1, 3))

    # Feature 8
    f8_items = [
        ("Municipal Command Dashboard:", "Live operational metrics showing unassigned tickets, SLA breaches, today's resolved count, and fleet readiness."),
        ("Clean City Pulse Composite Gauge:", "Real-time 0-100 composite index combining resolution velocity, SLA adherence, and hotspot mitigation."),
        ("SLA Countdown-Sorted Priority Queue:", "Live triage queue with real-time countdown clocks and priority filters."),
        ("Quick-Assign Squad Dispatch Modal:", "1-click squad allocation (Squad Alpha: Plastic Compactor, Squad Bravo: Biohazard Sharps, Squad Charlie: Organic Composting)."),
        ("PPE Checklist & Task Briefing:", "Assigns squad-specific safety equipment requirements and handling instructions."),
        ("Invalid / Spam Grievance Queue:", "Review portal for flagged blurred, out-of-boundary, or non-waste images.")
    ]
    f8_box = [Paragraph("<b>Feature 8: Municipal Command Center, Triage &amp; Field Operations</b>", h2_style)]
    for it_title, it_desc in f8_items:
        f8_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f8_box))
    story.append(Spacer(1, 3))

    # Feature 9
    f9_items = [
        ("Photographic Proof of Work:", "Sanitation squads must upload mandatory on-site 'After' cleanup photographs to complete assignments."),
        ("Interactive Touch/Drag Before/After Slider:", "Side-by-side interactive visual comparison slider allowing citizens to inspect and validate the cleanup."),
        ("Citizen Sign-off Workflow:", "Citizens confirm or reject cleanups with specific feedback notes."),
        ("Confetti Celebration Animation:", "Canvas confetti celebration upon citizen verification of completed work.")
    ]
    f9_box = [Paragraph("<b>Feature 9: Photographic Cleanup Verification &amp; Before/After Slider</b>", h2_style)]
    for it_title, it_desc in f9_items:
        f9_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f9_box))
    story.append(Spacer(1, 3))

    # Feature 10
    f10_items = [
        ("Green Points Civic Wallet:", "Automated points credit (+25 pts for valid complaint, +50 pts for verified cleanup)."),
        ("5-Tier Citizen Progression:", "Gamified badges (Eco Rookie &rarr; Eco Scout &rarr; Green Warrior &rarr; Eco Guardian &rarr; Clean City Champion)."),
        ("Municipal Rewards & Voucher Center:", "Points redemption ledger for public transport passes, municipal water bill rebates, and property tax discounts.")
    ]
    f10_box = [Paragraph("<b>Feature 10: Civic Gamification &amp; Green Points Rewards Center</b>", h2_style)]
    for it_title, it_desc in f10_items:
        f10_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f10_box))
    story.append(Spacer(1, 3))

    # Feature 11
    f11_items = [
        ("Socket.io Real-Time Event Bus:", "Instantaneous bidirectional event streaming for new reports, squad assignments, SLA breaches, and verifications."),
        ("In-App Notification Hub:", "Persistent notification drawer with unread badges, category filtering, and direct complaint deep-links."),
        ("Civic SMS Dispatch Service:", "Integrated SMS gateway (Fast2SMS / Twilio) sending real-time SMS alerts to citizen mobile phones upon grievance resolution.")
    ]
    f11_box = [Paragraph("<b>Feature 11: Real-Time Event Streaming &amp; Multi-Channel Alerts</b>", h2_style)]
    for it_title, it_desc in f11_items:
        f11_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f11_box))
    story.append(Spacer(1, 3))

    # Feature 12
    f12_items = [
        ("Stateless JWT & Bcrypt Authentication:", "10-round salted password hashing and secure token-based session handling."),
        ("Strict Role-Based Access Control (RBAC):", "Server-side and client-side guards across Citizen, Municipal Staff, and Administrator roles."),
        ("Municipal Watch & Governance Portal:", "Tracks ward-level Mean Time to Resolve (MTTR), squad workload balance, and staff KPI leaderboards."),
        ("User Management Center:", "Administrative control for modifying user roles, activating/deactivating accounts, and filtering by ward."),
        ("AI Model Telemetry & Accuracy Monitoring:", "Live telemetry tracking inference latency, confidence distributions, and class breakdowns."),
        ("Immutable System Audit Logs:", "Full trace history recording entity modifications, previous states, actor IDs, IP addresses, and timestamps.")
    ]
    f12_box = [Paragraph("<b>Feature 12: Administrative Governance, Municipal Watch &amp; Security</b>", h2_style)]
    for it_title, it_desc in f12_items:
        f12_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(f12_box))
    story.append(PageBreak())

    # =========================================================================
    # SECTION 4: MASTER FEATURE CATALOG - PART 2 (ROADMAP) (PAGE 5)
    # =========================================================================
    story.append(Paragraph("4. Master Feature Catalog - Features in Development &amp; Innovation Roadmap", h1_style))
    story.append(Paragraph(
        "To establish CleanTrack as an award-winning submission in Smart India Hackathon and real-world urban municipal governance, "
        "the following cutting-edge capabilities are designed and actively positioned on our development roadmap:",
        body_style
    ))

    # Feature R1: Worker Panel
    r1_items = [
        ("Mobile-First Worker Interface:", "A dedicated Progressive Web App (PWA) / tablet portal tailored specifically for field sanitation workers, squad leaders, and compactor truck drivers with high-contrast, large-button UI."),
        ("Dynamic Work Order Feed:", "Real-time list of assigned tasks prioritized by SLA expiration urgency and geospatial proximity, reducing idle time."),
        ("Turn-by-Turn GPS Dispatch Routing:", "Direct integration with OpenStreetMap / Google Maps directing the sanitation squad to the exact coordinates."),
        ("Digital PPE Safety Check-in:", "Mandatory pre-cleanup safety verification enforcing that workers possess required protective gear (e.g., puncture-proof Kevlar gloves for biohazards, safety boots, particulate masks) before unlocking the job."),
        ("Geo-Fenced Photographic Proof-of-Work:", "Worker camera captures are strictly validated against device GPS EXIF coordinates: 'After' photos can only be shot when physically within a 30m radius of the complaint spot, preventing fraudulent remote submissions."),
        ("Offline Field Caching & Background Sync:", "Field workers operating in basements or low-reception zones can log work offline; data is cached in IndexedDB and synced automatically via the Background Sync API upon reconnection."),
        ("On-Site Hazard Advisories:", "Instant audio/visual alerts notifying workers of specific on-site dangers (broken glass, needles, corrosive batteries) with containment protocols.")
    ]
    r1_box = [
        Paragraph("<b>Roadmap Feature 1: Dedicated Sanitation Worker Panel &amp; Field Operations PWA</b>", h2_style),
        Paragraph("<i>Provides ground-level sanitation crews with an intuitive, dedicated interface designed for field realities.</i>", callout_green)
    ]
    for it_title, it_desc in r1_items:
        r1_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(r1_box))
    story.append(Spacer(1, 4))

    # Feature R2: Biodegradable vs Non-Biodegradable
    r2_items = [
        ("AI Biodegradable vs. Non-Biodegradable Classifier:", "Advanced deep learning segmentation model trained to separate Organic/Wet Waste (food scraps, vegetable peelings, garden clippings, leaves) from Non-Biodegradable Refuse (single-use polymers, multilayered packaging, styrofoam, rubber)."),
        ("Wet vs. Dry Segregation Quality Index (SQI):", "A 0-100 metric assessing the segregation purity of community garbage dumps (e.g., '82% Organic Purity - Green Stream' vs 'Heavy Polymer Contamination')."),
        ("Composting & Biogas Yield Estimator:", "Mathematical models predicting estimated compost yield (kg of organic fertilizer) and biomethane generation potential (m³) from the detected organic volume."),
        ("Decomposition & Odor Risk Scoring:", "Assesses the rotting stage of organic dumps, predicting fly/pest breeding risk, leachate runoff, and odor radius based on ambient temperature and time elapsed."),
        ("Citizen Source-Segregation Guidance:", "Provides immediate visual recommendations to citizens on how to segregate mixed household waste at source.")
    ]
    r2_box = [
        Paragraph("<b>Roadmap Feature 2: Degradable vs. Biodegradable AI Detection &amp; Reporting</b>", h2_style),
        Paragraph("<i>Enables precise segregation of wet organic compostable refuse from persistent plastics, maximizing municipal recycling.</i>", callout_green)
    ]
    for it_title, it_desc in r2_items:
        r2_box.append(Paragraph(f"&bull; <b>{it_title}</b> {it_desc}", bullet_style))
    story.append(KeepTogether(r2_box))
    story.append(Spacer(1, 4))

    # Additional Roadmap Features
    addl_roadmap_p5 = [
        ("Roadmap Feature 3: AI Cleanup Fraud Detection (SSIM & Siamese Neural Networks)",
         "Automated Computer Vision comparison evaluating Before and After photos using Structural Similarity Index (SSIM) and deep Siamese feature embeddings to verify cleanup authenticity."),
        
        ("Roadmap Feature 4: Dynamic Garbage Truck Route Optimization (VRP / TSP Solver)",
         "Integrates Google OR-Tools / OSRM to solve the Vehicle Routing Problem (VRP), computing shortest fuel-optimized paths connecting high-priority tickets, hotspots, and overflowing smart bins."),
        
        ("Roadmap Feature 5: IoT Smart Bin Ultrasonic Fill-Level Telemetry",
         "Low-cost ultrasonic IoT sensors (LoRaWAN / ESP32 MQTT) transmitting live fill levels (0-100%) to municipal GIS heatmaps, dispatching trucks before bins overflow."),
        
        ("Roadmap Feature 6: Multi-Modal WhatsApp & Telegram Civic Reporting Bot",
         "Frictionless reporting via messaging apps: citizens send photo + live GPS pin to create complaints and receive conversational status updates in their preferred language."),
        
        ("Roadmap Feature 7: Bhashini / Whisper AI Multi-Lingual Regional Voice Reporting",
         "Voice-to-text grievance logging in 12+ Indian regional languages (Hindi, Marathi, Tamil, Telugu, Gujarati, Bengali, etc.), enabling universal civic accessibility."),
        
        ("Roadmap Feature 8: Carbon Footprint & Methane Emission Predictor",
         "Mathematical modeling calculating greenhouse gas emissions (CO2e & CH4) averted by timely waste removal, displaying citizen environmental impact scores and city sustainability indices.")
    ]

    for rf_title, rf_desc in addl_roadmap_p5:
        rf_box = [
            Paragraph(f"<b>{rf_title}:</b> {rf_desc}", bullet_style)
        ]
        story.append(KeepTogether(rf_box))

    story.append(PageBreak())

    # =========================================================================
    # SECTION 5: MATHEMATICAL MODELS & FORMULAS (PAGE 6)
    # =========================================================================
    story.append(Paragraph("Roadmap Feature 9: Municipal CCTV &amp; Aerial Drone Survey Ingestion", h2_style))
    story.append(Paragraph(
        "Continuous or interval-based frame extraction from existing traffic CCTV cameras, sanitation truck dashcams, and drone surveys. "
        "Computer Vision models automatically detect roadside garbage mounds and open landfill fires without requiring manual citizen reporting.",
        body_style
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("5. Mathematical Formulations &amp; Core Algorithms", h1_style))
    story.append(Paragraph(
        "CleanTrack replaces subjective human intuition with rigorous mathematical and geospatial algorithms:",
        body_style
    ))

    # Formula 1: Priority Score
    f1_math = [
        [Paragraph("<b>1. Multi-Factor AI Priority Score Formulation (0 to 100 Scale)</b>", h2_style)],
        [Paragraph(
            "Every grievance is scored automatically using a 5-factor weighted parametric equation:<br/>"
            "<b>Priority Score = W<sub>hazard</sub> + V<sub>extent</sub> + L<sub>sensitivity</sub> + R<sub>recurrence</sub> + T<sub>decay</sub></b><br/>"
            "&bull; <b>Waste Type Hazard (W<sub>hazard</sub>, Max 30 pts):</b> Syringes/Needles = 30 pts; Biohazard Contaminated Cotton/Bandages = 22 pts; Toxic E-Waste = 20 pts; Plastic Packaging = 12-18 pts; Clean = 0 pts.<br/>"
            "&bull; <b>Visual Area Coverage (V<sub>extent</sub>, Max 30 pts):</b> Derived directly from YOLO bounding box pixel dimensions: <code>min(30, 18 + Coverage% &times; 0.2 + ItemCount &times; 0.5)</code>.<br/>"
            "&bull; <b>Location Sensitivity (L<sub>sensitivity</sub>, Max 25 pts):</b> Hospital/School zone = 25 pts; Commercial/Market = 20 pts; Residential = 15 pts; Open Suburban = 10 pts.<br/>"
            "&bull; <b>Chronic Recurrence (R<sub>recurrence</sub>, Max 10 pts):</b> Evaluates historical complaints within 100m radius over past 30 days.<br/>"
            "&bull; <b>Time Aging (T<sub>decay</sub>, Max 5 pts):</b> Incremental boost as SLA approaches expiration.",
            body_style
        )]
    ]
    f1_math_table = Table(f1_math, colWidths=[487])
    f1_math_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(KeepTogether([f1_math_table]))
    story.append(Spacer(1, 3))

    # Formula 2: Haversine
    f2_math = [
        [Paragraph("<b>2. 50-Meter Haversine Geospatial Duplicate Clustering</b>", h2_style)],
        [Paragraph(
            "Spherical geodesic distance between two complaint coordinates P<sub>1</sub>(&phi;<sub>1</sub>, &lambda;<sub>1</sub>) and P<sub>2</sub>(&phi;<sub>2</sub>, &lambda;<sub>2</sub>):<br/>"
            "<b>d = 2R &times; arcsin(&radic;(sin<sup>2</sup>(&Delta;&phi;/2) + cos(&phi;<sub>1</sub>)&middot;cos(&phi;<sub>2</sub>)&middot;sin<sup>2</sup>(&Delta;&lambda;/2))) &le; 0.050 km</b><br/>"
            "Executed natively inside MongoDB via <code>$geoNear</code> with spherical geometry coordinates. If an active, unresolved complaint is discovered within 50m, the new submission is linked as a corroborating duplicate report, preventing redundant squad mobilization.",
            body_style
        )]
    ]
    f2_math_table = Table(f2_math, colWidths=[487])
    f2_math_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(KeepTogether([f2_math_table]))
    story.append(Spacer(1, 3))

    # Formula 3: Clean City Pulse & Composting Math
    f3_math = [
        [Paragraph("<b>3. Clean City Pulse Composite Gauge &amp; Organic Composting Math</b>", h2_style)],
        [Paragraph(
            "&bull; <b>Clean City Pulse Index (0 to 100 Index):</b> "
            "<b>Clean City Pulse = (Resolution Rate &times; 0.45) + (SLA Adherence &times; 0.35) + (Hotspot Control &times; 0.20)</b><br/>"
            "&bull; <b>Organic Composting Yield:</b> "
            "<b>Compost Yield (kg) = Organic Refuse (kg) &times; 0.45 &times; (1 - Contamination Fraction)</b><br/>"
            "&bull; <b>Biomethane Potential:</b> "
            "<b>Biomethane Potential (m<sup>3</sup>) = Organic Dry Matter (kg) &times; 0.28 m<sup>3</sup>/kg Volatile Solids</b>",
            body_style
        )]
    ]
    f3_math_table = Table(f3_math, colWidths=[487])
    f3_math_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(KeepTogether([f3_math_table]))
    story.append(Spacer(1, 4))

    # =========================================================================
    # SECTION 6: DATABASE SCHEMA (PAGE 6)
    # =========================================================================
    story.append(Paragraph("6. Database Architecture &amp; Key Data Models", h1_style))
    story.append(Paragraph(
        "CleanTrack implements 10 relational Mongoose schemas in MongoDB designed for ACID consistency, auditability, and rapid indexed spatial queries.",
        body_style
    ))

    schema_headers = [
        Paragraph("<b>Model Name</b>", table_header_style),
        Paragraph("<b>Primary Fields &amp; Schema Types</b>", table_header_style),
        Paragraph("<b>Key Indexes &amp; Relations</b>", table_header_style)
    ]

    schema_rows = [
        schema_headers,
        [Paragraph("<b>User</b>", table_cell_bold), Paragraph("name, email, passwordHash, role (citizen / staff / admin), phone, ward, greenPoints", table_cell_style), Paragraph("unique(email), index(role, ward)", table_cell_style)],
        [Paragraph("<b>Complaint</b>", table_cell_bold), Paragraph("complaintId, title, imageUrl, location (GeoJSON Point), ward, aiCategory, aiPriorityScore, severity, status, sla (dueAt, breached)", table_cell_style), Paragraph("2dsphere(location), index(status), index(sla.dueAt)", table_cell_style)],
        [Paragraph("<b>AIAnalysis</b>", table_cell_bold), Paragraph("complaintId, modelUsed, detections (classId, label, confidence, box), coveragePercent, segregationStream", table_cell_style), Paragraph("ref(complaintId), index(modelUsed)", table_cell_style)],
        [Paragraph("<b>Assignment</b>", table_cell_bold), Paragraph("complaintId, assignedSquadId, squadName, assignedBy, notes, ppeChecklist, dispatchedAt, completedAt", table_cell_style), Paragraph("ref(complaintId), ref(assignedSquadId)", table_cell_style)],
        [Paragraph("<b>Verification</b>", table_cell_bold), Paragraph("complaintId, beforeImageUrl, afterImageUrl, submittedByStaff, citizenStatus, citizenNotes, verifiedAt", table_cell_style), Paragraph("ref(complaintId), index(citizenStatus)", table_cell_style)],
        [Paragraph("<b>Hotspot</b>", table_cell_bold), Paragraph("hotspotId, title, centerCoordinates (GeoJSON), radiusMeters, complaintCount, recurringSeverity", table_cell_style), Paragraph("2dsphere(centerCoordinates)", table_cell_style)],
        [Paragraph("<b>Reward</b>", table_cell_bold), Paragraph("userId, pointsAwarded, transactionType (report / cleanup / voucher), balanceAfter", table_cell_style), Paragraph("ref(userId), index(createdAt)", table_cell_style)],
        [Paragraph("<b>Notification</b>", table_cell_bold), Paragraph("recipientId, title, message, type (complaint / sla / reward), isRead, deepLinkUrl", table_cell_style), Paragraph("ref(recipientId), index(isRead)", table_cell_style)],
        [Paragraph("<b>SystemSetting</b>", table_cell_bold), Paragraph("slaThresholds (criticalHours, mediumHours, normalHours), duplicateRadiusMeters", table_cell_style), Paragraph("singleton configuration document", table_cell_style)],
        [Paragraph("<b>AuditLog</b>", table_cell_bold), Paragraph("eventType, entityId, performedBy, oldState, newState, timestamp, ipAddress", table_cell_style), Paragraph("index(eventType, entityId, timestamp)", table_cell_style)]
    ]

    schema_table = Table(schema_rows, colWidths=[75, 272, 140])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 2.2),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(schema_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 7: REST API REFERENCE & CORE ENDPOINTS (PAGE 7)
    # =========================================================================
    story.append(Paragraph("7. REST API Reference &amp; Core Service Endpoints", h1_style))
    story.append(Paragraph(
        "CleanTrack exposes a stateless, RESTful JSON API secured via JWT and Role-Based Access Control:",
        body_style
    ))

    api_headers = [
        Paragraph("<b>Method &amp; Endpoint</b>", table_header_style),
        Paragraph("<b>Access Role</b>", table_header_style),
        Paragraph("<b>Description &amp; Operational Payload</b>", table_header_style)
    ]

    api_rows = [
        api_headers,
        [Paragraph("<code>POST /api/auth/login</code>", table_cell_bold), Paragraph("Public", table_cell_style), Paragraph("Authenticates credentials, returns signed JWT token with user role and ward context", table_cell_style)],
        [Paragraph("<code>POST /api/complaints</code>", table_cell_bold), Paragraph("Citizen", table_cell_style), Paragraph("Submits photo multipart data, triggers AI inference, executes 50m deduplication, logs ticket", table_cell_style)],
        [Paragraph("<code>GET /api/complaints/my</code>", table_cell_bold), Paragraph("Citizen", table_cell_style), Paragraph("Retrieves personal complaints with current status, timeline stages, and assigned squad", table_cell_style)],
        [Paragraph("<code>GET /api/complaints/:id</code>", table_cell_bold), Paragraph("Authenticated", table_cell_style), Paragraph("Detailed complaint profile with AI detections, Before/After image URLs, and audit log", table_cell_style)],
        [Paragraph("<code>GET /api/municipal/priority-queue</code>", table_cell_bold), Paragraph("Staff / Admin", table_cell_style), Paragraph("Fetches active triage queue ordered dynamically by remaining SLA time to deadline", table_cell_style)],
        [Paragraph("<code>POST /api/municipal/dispatch</code>", table_cell_bold), Paragraph("Municipal Staff", table_cell_style), Paragraph("Assigns complaint to specialized squad with PPE checklist and target resolution SLA", table_cell_style)],
        [Paragraph("<code>POST /api/verification/upload-proof</code>", table_cell_bold), Paragraph("Municipal Staff", table_cell_style), Paragraph("Uploads on-site 'After' photograph, marking ticket status as Pending Citizen Verification", table_cell_style)],
        [Paragraph("<code>POST /api/verification/confirm</code>", table_cell_bold), Paragraph("Citizen", table_cell_style), Paragraph("Citizen sign-off on cleanup; credits Green Points (+50) and updates Clean City Pulse", table_cell_style)],
        [Paragraph("<code>POST /api/admin/test/escalate/:id</code>", table_cell_bold), Paragraph("Administrator", table_cell_style), Paragraph("Simulates SLA breach, triggers auto-escalation to Critical and pushes WebSocket alarm", table_cell_style)],
        [Paragraph("<code>GET /api/admin/municipal-watch</code>", table_cell_bold), Paragraph("Administrator", table_cell_style), Paragraph("High-level governance metrics: ward-level MTTR, squad utilization, and staff KPI tables", table_cell_style)]
    ]

    api_table = Table(api_rows, colWidths=[130, 75, 282])
    api_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_DARK),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 2.2),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(api_table)
    story.append(Spacer(1, 5))

    # =========================================================================
    # SECTION 8: COMPLETE TECHNOLOGY MATRIX (PAGE 7)
    # =========================================================================
    story.append(Paragraph("8. Complete Technology Stack Matrix", h1_style))

    tech_matrix_header = [
        Paragraph("<b>Domain / Layer</b>", table_header_style),
        Paragraph("<b>Technology</b>", table_header_style),
        Paragraph("<b>Version</b>", table_header_style),
        Paragraph("<b>Role &amp; Architectural Function in CleanTrack</b>", table_header_style)
    ]

    tech_matrix_rows = [
        tech_matrix_header,
        [Paragraph("Frontend Framework", table_cell_bold), Paragraph("React.js", table_cell_style), Paragraph("19.2.x", table_cell_style), Paragraph("Component-based UI architecture, virtual DOM reconciliation, and multi-role state management", table_cell_style)],
        [Paragraph("Build Engine", table_cell_bold), Paragraph("Vite", table_cell_style), Paragraph("8.2.x", table_cell_style), Paragraph("Next-gen ESM development server, sub-second Hot Module Replacement (HMR)", table_cell_style)],
        [Paragraph("UI Styling", table_cell_bold), Paragraph("Tailwind CSS", table_cell_style), Paragraph("3.4.x", table_cell_style), Paragraph("Utility-first responsive styling, glassmorphism cards, and color-coded CPCB stream tokens", table_cell_style)],
        [Paragraph("Client Routing", table_cell_bold), Paragraph("React Router", table_cell_style), Paragraph("7.18.x", table_cell_style), Paragraph("Declarative SPA routing, protected route guards, and role barrier redirects", table_cell_style)],
        [Paragraph("Geospatial GIS", table_cell_bold), Paragraph("Leaflet GIS", table_cell_style), Paragraph("1.9.4 / 5.0", table_cell_style), Paragraph("Interactive ward maps, draggable coordinate pin selectors, and color-coded hotspot clusters", table_cell_style)],
        [Paragraph("Data Visualization", table_cell_bold), Paragraph("Recharts", table_cell_style), Paragraph("3.10.x", table_cell_style), Paragraph("Composable SVG charts, complaint trends, category distributions, and Clean City Pulse gauge", table_cell_style)],
        [Paragraph("Backend Runtime", table_cell_bold), Paragraph("Node.js", table_cell_style), Paragraph("v20+ / v22", table_cell_style), Paragraph("Asynchronous, event-driven JavaScript server runtime for high-throughput operations", table_cell_style)],
        [Paragraph("Web Server", table_cell_bold), Paragraph("Express.js", table_cell_style), Paragraph("4.21.x", table_cell_style), Paragraph("Modular RESTful API routing, MVC controllers, middleware chaining, and centralized error handling", table_cell_style)],
        [Paragraph("Database Layer", table_cell_bold), Paragraph("MongoDB", table_cell_style), Paragraph("8.x / Atlas", table_cell_style), Paragraph("NoSQL document storage with native GeoJSON spherical geometry indexing for spatial queries", table_cell_style)],
        [Paragraph("Data Modeling (ODM)", table_cell_bold), Paragraph("Mongoose", table_cell_style), Paragraph("8.10.x", table_cell_style), Paragraph("Schema validation, strict typings, 2dsphere indexes, pre-save hooks, and ObjectId population", table_cell_style)],
        [Paragraph("Real-Time WebSockets", table_cell_bold), Paragraph("Socket.io", table_cell_style), Paragraph("4.8.x", table_cell_style), Paragraph("Bi-directional, event-driven WebSocket communication for live alarms and status sync", table_cell_style)],
        [Paragraph("Background Cron", table_cell_bold), Paragraph("Node-Cron", table_cell_style), Paragraph("3.0.x", table_cell_style), Paragraph("Background scheduler continuously evaluating and escalating breached SLA complaint deadlines", table_cell_style)],
        [Paragraph("AI / ML Framework", table_cell_bold), Paragraph("Ultralytics YOLO", table_cell_style), Paragraph("8.x / 11.x", table_cell_style), Paragraph("Multi-model custom neural networks for real-time plastic, biomedical, and electronic waste detection", table_cell_style)],
        [Paragraph("Deep Learning Core", table_cell_bold), Paragraph("PyTorch &amp; Python", table_cell_style), Paragraph("3.10+ / 2.x", table_cell_style), Paragraph("Neural network tensor execution, model weight processing, and GPU-accelerated inference", table_cell_style)],
        [Paragraph("Auth & Cryptography", table_cell_bold), Paragraph("JWT &amp; Bcrypt.js", table_cell_style), Paragraph("9.0.x / 2.4.x", table_cell_style), Paragraph("Stateless token authorization and 10-round salted one-way password hashing", table_cell_style)],
        [Paragraph("API Security", table_cell_bold), Paragraph("Helmet &amp; Rate-Limit", table_cell_style), Paragraph("Latest", table_cell_style), Paragraph("HTTP security headers, XSS mitigation, and IP-based endpoint throttling against brute force", table_cell_style)]
    ]

    tech_table = Table(tech_matrix_rows, colWidths=[92, 85, 45, 265])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 2.2),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(tech_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 9 & 10: REGULATORY COMPLIANCE, ADVANTAGES & CONCLUSION (PAGE 8)
    # =========================================================================
    story.append(Paragraph("9. Regulatory Compliance &amp; Alignment with National Initiatives", h1_style))
    story.append(Paragraph(
        "CleanTrack directly addresses statutory environmental and urban governance mandates in India:",
        body_style
    ))

    compliance_items = [
        ("CPCB & WHO Biomedical Waste Rules (2016/2018):", "Mandates non-negotiable segregation of sharps and contaminated clinical refuse at point of generation. CleanTrack's AI detects sharps and automates dispatch of puncture-proof containment units."),
        ("Swachh Bharat Mission (Urban 2.0):", "Supports garbage-free cities (GFC), remediation of legacy dumpsites, and 100% source segregation across urban local bodies (ULBs)."),
        ("E-Waste (Management) Rules 2022 & Extended Producer Responsibility (EPR):", "Enables municipal sorting yards to route electronic scrap directly to certified recyclers instead of landfills."),
        ("UN Sustainable Development Goals (SDGs):", "Directly advances SDG 3 (Good Health & Well-being), SDG 11 (Sustainable Cities & Communities), SDG 12 (Responsible Consumption & Production), and SDG 13 (Climate Action).")
    ]

    for c_title, c_desc in compliance_items:
        story.append(Paragraph(f"&bull; <b>{c_title}</b> {c_desc}", bullet_style))

    story.append(Spacer(1, 6))

    story.append(Paragraph("10. Competitive Advantages &amp; SIH Distinction", h1_style))
    story.append(Paragraph(
        "CleanTrack stands out decisively from existing governmental and academic prototypes:",
        body_style
    ))

    advantages = [
        ("Complete End-to-End Closed Loop:", "Unlike apps that stop at complaint registration, CleanTrack manages the complete lifecycle from AI detection to field squad allocation, Before/After verification, and civic gamification."),
        ("Multi-Class Hazard Intelligence:", "Directly addresses India's acute biomedical sharps and e-waste crisis, enforcing WHO/CPCB segregation rules and protecting sanitation workers."),
        ("Algorithmic Rigor over Subjective Triage:", "Mathematical 5-factor priority formula and 50m Haversine deduplication save thousands of liters of municipal fuel annually."),
        ("Automated Accountability:", "Background SLA watchdog cron guarantees that forgotten complaints cannot fall through the cracks, auto-escalating to city commissioners."),
        ("Civic Trust through Visual Proof:", "Interactive Before/After slider restores citizen faith in municipal responsiveness, transforming passive residents into active Eco Champions.")
    ]

    for adv_t, adv_d in advantages:
        story.append(Paragraph(f"&bull; <b>{adv_t}</b> {adv_d}", bullet_style))

    story.append(Spacer(1, 10))

    # Final Authority Callout Box on Page 8
    final_box = [
        [
            Paragraph("<b>PLATFORM CONCLUSION &amp; DEPLOYMENT READINESS DECLARATION</b>", 
                      ParagraphStyle('CalloutBadge', fontName='Helvetica-Bold', fontSize=8, textColor=PRIMARY, backColor=PRIMARY_LIGHT, spaceAfter=2))
        ],
        [
            Paragraph(
                "CleanTrack represents a technologically complete, socially transformative, and scalable civic operating system ready for municipal deployment under the Smart Cities Mission and Swachh Bharat Abhiyan Urban 2.0. By unifying deep learning computer vision, geospatial intelligence, background SLA automation, and civic gamification, CleanTrack eliminates the systemic failures of traditional grievance portals and transforms urban sanitation from an open loop into an efficient, verifiable, and transparent public service.",
                callout_style
            )
        ]
    ]
    final_table = Table(final_box, colWidths=[487])
    final_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdfa")),
        ('BOX', (0,0), (-1,-1), 1.25, PRIMARY),
        ('PADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(final_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    abs_path = os.path.abspath(filename)
    print(f"[SUCCESS] Master PDF generated successfully at: {abs_path}")
    return abs_path

if __name__ == '__main__':
    output_filename = "CleanTrack_Master_Project_Report.pdf"
    if len(sys.argv) > 1:
        output_filename = sys.argv[1]
    # Build both reports so they are identical in quality and completeness
    build_pdf(output_filename)
    build_pdf("CleanTrack_Comprehensive_Project_Report.pdf")
