import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable
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
        self.saveState()
        
        # Running Top Header
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0f766e"))
        self.drawString(54, 804, "CleanTrack")
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(104, 804, "— Platform Capabilities & Innovation Roadmap")
        self.drawRightString(541, 804, "Technical Features Report")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(54, 796, 541, 796)

        # Running Bottom Footer
        self.line(54, 44, 541, 44)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 32, "Smart India Hackathon (SIH) | CleanTrack Civic Cleanliness Platform")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(541, 32, page_text)
        
        self.restoreState()

def build_pdf(filename="CleanTrack_Features_and_Roadmap.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Palette
    PRIMARY = colors.HexColor("#0f766e")       # Deep Teal
    PRIMARY_DARK = colors.HexColor("#115e59")  # Dark Teal
    PRIMARY_LIGHT = colors.HexColor("#f0fdfa") # Teal Tint
    SECONDARY = colors.HexColor("#1e293b")     # Slate Dark
    BORDER_COLOR = colors.HexColor("#cbd5e1")  # Slate Border
    BG_LIGHT = colors.HexColor("#f8fafc")      # Off-white / light slate
    TEXT_DARK = colors.HexColor("#0f172a")     # Very dark slate
    TEXT_MUTED = colors.HexColor("#475569")    # Muted slate

    # Typography Styles
    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=PRIMARY,
        spaceAfter=4
    )
    
    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=SECONDARY,
        spaceAfter=6
    )

    cover_meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=TEXT_MUTED
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=SECONDARY,
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
        spaceAfter=2
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK,
        leftIndent=10,
        spaceAfter=2
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=TEXT_DARK
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName='Helvetica-Bold'
    )

    story = []

    # =========================================================================
    # TITLE BANNER
    # =========================================================================
    banner_data = [
        [
            Paragraph("<b>CLEANTRACK PLATFORM — FEATURE AUDIT &amp; INNOVATION ROADMAP</b>", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=8, textColor=PRIMARY, backColor=PRIMARY_LIGHT, spaceAfter=2)),
        ],
        [
            Paragraph("Developed Platform Features &amp; Uniqueness Engineering Blueprint", cover_title_style)
        ],
        [
            Paragraph("Detailed breakdown of production-ready features already engineered in CleanTrack, along with high-impact innovative features proposed for Smart India Hackathon (SIH) distinction.", cover_subtitle_style)
        ],
        [
            HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=4)
        ],
        [
            Paragraph(
                "<b>Platform Core:</b> React 19 &bull; Vite &bull; Node.js Express &bull; MongoDB 2dsphere &bull; YOLOv8 Neural Inference &bull; Socket.io<br/>"
                "<b>Focus Domains:</b> Computer Vision, SLA Background Automation, Geospatial Duplicate Clustering, Civic Gamification",
                cover_meta_style
            )
        ]
    ]

    banner_table = Table(banner_data, colWidths=[487])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 6))

    # =========================================================================
    # PART 1: FEATURES ALREADY DEVELOPED
    # =========================================================================
    story.append(Paragraph("PART 1: Complete List of Features Already Developed", h1_style))
    story.append(Paragraph(
        "The following capabilities are fully engineered, integrated across frontend/backend, and operational within the CleanTrack platform:",
        body_style
    ))
    story.append(Spacer(1, 3))

    developed_categories = [
        ("1. AI Computer Vision & Deep Learning Inference Engine", [
            "<b>Dual-Model YOLOv8 Computer Vision:</b> Fine-tuned neural networks (best.pt and cleantrack_biomedical_best.pt) performing instant object detection on incoming waste images.",
            "<b>25+ Waste Classes Identified:</b> Detects PET bottles, HDPE jugs, LDPE films, PP rigid items, clinical syringes, hypodermic needles, surgical gloves, PPE, gauze bandages, test tubes, e-waste peripherals, and organic wet waste.",
            "<b>Automated Bounding Boxes & Confidence:</b> Generates precise pixel coordinates, class labels, and individual detection confidence percentages.",
            "<b>CPCB & WHO Statutory Segregation:</b> Maps detected waste to regulatory color-coded streams (Yellow: Incineration, Red: Autoclaving, Blue: Glass, Black: Non-hazardous).",
            "<b>Physical Volume & Mass Estimation Math:</b> Algorithms calculating estimated volume (Liters, m³) and mass (kg, g) with matching disposal container requirements (e.g., 0.5L puncture-proof sharps box).",
            "<b>Standalone Real-Time Desktop Watcher & Portal:</b> Automated folder monitoring scripts (watch_desktop.py, detect_desktop_images.py) and standalone HTML biomedical testing suite."
        ]),

        ("2. Citizen Reporting & Interactive Engagement Portal", [
            "<b>3-Step AI-Guided Reporting Wizard:</b> Streamlined reporting workflow (Photo capture/upload -> Real-time AI Analysis -> Location & Details).",
            "<b>1-Click Sample Testing Suite:</b> Pre-loaded test cases for Plastic dumps, Medical sharps, Surgical PPE, and Electronics for instant testing.",
            "<b>Interactive AI Scanning HUD:</b> Animated client-side visual scanning overlay providing real-time feedback during neural processing.",
            "<b>Interactive Leaflet Location Picker:</b> Drag-and-drop coordinate pin, automated HTML5 browser GPS geolocation, and reverse geocoding to municipal ward numbers and landmarks.",
            "<b>Citizen Command Dashboard:</b> Live metric overview showing active complaints, resolved cases, and cumulative Green Points wallet balance.",
            "<b>My Complaints Management:</b> Searchable grievance table with status filters (Pending, Dispatched, In Progress, Resolved) and priority badges.",
            "<b>Step-by-Step Ticket Tracker:</b> Comprehensive complaint detail page with visual milestone timeline, assigned squad details, and full audit logs."
        ]),

        ("3. Intelligent Operational Triage & Background SLA Escalation", [
            "<b>5-Factor Mathematical AI Priority Formula:</b> Automated 0-100 scoring based on Waste Type Hazard (30%), Visual Extent Coverage (30%), Location Sensitivity (25%), Chronic Recurrence (10%), and Time Elapsed (5%).",
            "<b>Dynamic Severity Levels:</b> Automatic classification into Low, Medium, High, and Critical priority tiers.",
            "<b>Time-Based SLA Engine:</b> Automated resolution deadlines dynamically calculated (Critical: 12h, Medium: 24h, Normal: 48h).",
            "<b>Background SLA Watchdog Cron:</b> Continuous background worker (node-cron running every 60s) checking for overdue tickets (dueAt < NOW).",
            "<b>Automated Escalation & Alarms:</b> Automatically escalates overdue complaints to CRITICAL, appends priority history, records an immutable audit log, and pushes emergency alerts via WebSockets.",
            "<b>Admin Manual Escalation Trigger:</b> Dedicated HTTP testing endpoint allowing instant demonstration of SLA breach mechanics."
        ]),

        ("4. GIS Spatial Mapping, Duplicate Clustering & Hotspot Analytics", [
            "<b>50-Meter Haversine Spatial Duplicate Clustering:</b> MongoDB 2dsphere indexing ($geoNear) identifying redundant reports within a 50m radius, grouping them to eliminate redundant truck dispatches.",
            "<b>Chronic Recurring Waste Detection:</b> Automatically detects repeat dump sites (>= 3 complaints within 14 days), computing recurrence level and root-cause inferences.",
            "<b>Interactive GIS Hotspot Heatmaps:</b> Leaflet-based ward maps displaying color-coded severity heat zones, circular radius overlays, and active problem clusters.",
            "<b>Citizen Public Hotspots View:</b> Publicly accessible city map keeping citizens informed of neighborhood waste hotspots and community cleanups."
        ]),

        ("5. Municipal Command Center, Triage & Field Operations", [
            "<b>Municipal Command Dashboard:</b> Live operational metrics showing unassigned tickets, SLA breaches, today's resolved count, and fleet readiness.",
            "<b>Clean City Pulse Composite Gauge:</b> Real-time 0-100 composite index combining resolution velocity, SLA adherence, and hotspot mitigation.",
            "<b>SLA Countdown-Sorted Priority Queue:</b> Live triage queue with real-time countdown clocks and priority filters.",
            "<b>Quick-Assign Squad Dispatch Modal:</b> 1-click squad allocation (Squad Alpha: Plastic Compactor, Squad Bravo: Biohazard Sharps, Squad Charlie: Organic Composting).",
            "<b>PPE Checklist & Task Briefing:</b> Assigns squad-specific safety equipment requirements and handling instructions.",
            "<b>Field Assignments Management:</b> Tracks ongoing dispatches, squad statuses, and work order transitions.",
            "<b>AI Operational Recommendations Page:</b> Municipal guidance on team routing, disposal methods, and equipment checklists.",
            "<b>Invalid / Spam Grievance Queue:</b> Review portal for flagged blurred, out-of-boundary, or non-waste images."
        ]),

        ("6. Photographic Cleanup Verification & Civic Gamification", [
            "<b>Photographic Proof of Work:</b> Field sanitation squads upload mandatory on-site 'After' cleanup photographs to complete assignments.",
            "<b>Interactive Touch/Drag Before/After Slider:</b> Side-by-side interactive visual comparison slider allowing citizens to inspect and validate the cleanup.",
            "<b>Citizen Sign-off Workflow:</b> Citizens confirm or reject cleanups with specific feedback notes.",
            "<b>Confetti Celebration Animation:</b> Canvas confetti celebration upon citizen verification of completed work.",
            "<b>Green Points Civic Wallet:</b> Automated points credit (+25 pts for valid complaint, +50 pts for verified cleanup).",
            "<b>5-Tier Citizen Progression:</b> Gamified badges (Eco Rookie -> Eco Scout -> Green Warrior -> Eco Guardian -> Clean City Champion).",
            "<b>Municipal Rewards & Voucher Center:</b> Points redemption ledger for public transport passes, municipal water bill rebates, and property tax discounts."
        ]),

        ("7. Real-Time Communications & Multi-Channel Alerts", [
            "<b>Socket.io Real-Time Event Bus:</b> Instantaneous bidirectional event streaming for new reports, squad assignments, SLA breaches, and verifications.",
            "<b>In-App Notification Hub:</b> Persistent notification drawer with unread badges, category filtering, and direct complaint deep-links.",
            "<b>Civic SMS Dispatch Service:</b> Integrated SMS gateway (Fast2SMS / Twilio) sending real-time SMS alerts to citizen mobile phones upon grievance resolution."
        ]),

        ("8. Administrative Oversight, Security & System Auditing", [
            "<b>Stateless JWT & Bcrypt Authentication:</b> 10-round salted password hashing and secure token-based session handling.",
            "<b>Strict Role-Based Access Control (RBAC):</b> Server-side and client-side guards across Citizen, Municipal Staff, and Administrator roles.",
            "<b>Municipal Watch & Governance Portal:</b> Tracks ward-level Mean Time to Resolve (MTTR), squad workload balance, and staff KPI leaderboards.",
            "<b>User Management Center:</b> Administrative control for modifying user roles, activating/deactivating accounts, and filtering by ward.",
            "<b>AI Model Telemetry & Accuracy Monitoring:</b> Live telemetry tracking inference latency, confidence distributions, and class breakdowns.",
            "<b>Immutable System Audit Logs:</b> Full trace history recording entity modifications, previous states, actor IDs, IP addresses, and timestamps."
        ])
    ]

    for cat_title, items in developed_categories:
        cat_flowables = [
            Paragraph(f"<b>{cat_title}</b>", h2_style),
        ]
        for itm in items:
            cat_flowables.append(Paragraph(f"&bull; {itm}", bullet_style))
        cat_flowables.append(Spacer(1, 2))
        story.append(KeepTogether(cat_flowables))

    story.append(Spacer(1, 5))

    # =========================================================================
    # PART 2: FEATURES WE CAN DEVELOP TO MAKE PROJECT UNIQUE
    # =========================================================================
    story.append(Paragraph("PART 2: Innovative Features to Develop (To Make Project Unique)", h1_style))
    story.append(Paragraph(
        "To establish CleanTrack as a gold-standard, award-winning entry in Smart India Hackathon (SIH) and urban governance competitions, the following next-generation capabilities are designed for development:",
        body_style
    ))
    story.append(Spacer(1, 3))

    unique_features = [
        ("1. AI Cleanup Fraud Detection (SSIM & Siamese Neural Networks)",
         "Automated Computer Vision comparison that evaluates the 'Before' and 'After' photos using Structural Similarity Index (SSIM) and deep Siamese feature embeddings. Automatically detects if the cleanup photo was taken from the correct location, if the waste was genuinely cleared, or if fraudulent/stock photos were uploaded by sanitation personnel."),

        ("2. Offline On-Device Edge AI Scanner (TensorFlow.js / ONNX Web PWA)",
         "Run lightweight quantized neural inference directly in the citizen's web browser or mobile client without internet connectivity. Complaints are saved locally in IndexedDB and automatically synced via the Background Sync API when connectivity is restored, enabling rural/suburban usage."),

        ("3. Multi-Modal WhatsApp & Telegram Civic Reporting Bot",
         "Allow citizens to report grievances by simply sending a waste photo and a live GPS pin via WhatsApp or Telegram. The backend bot processes the image with YOLOv8, creates the complaint, and provides conversational updates in the citizen's preferred language."),

        ("4. Bhashini / Whisper AI Multi-Lingual Voice Reporting",
         "Voice-to-text grievance logging in 12+ Indian regional languages (Hindi, Marathi, Tamil, Telugu, Gujarati, Bengali, etc.). Non-tech-savvy citizens and sanitation workers can speak their complaint, which is transcribed, translated, and categorized automatically."),

        ("5. Dynamic Garbage Truck Route Optimization (VRP / TSP Solver)",
         "Integrate Google OR-Tools / OSRM to dynamically solve the Vehicle Routing Problem (VRP). Computes the shortest, fuel-optimized collection routes for municipal compactor trucks connecting high-priority tickets, chronic hotspots, and overflowing smart bins."),

        ("6. IoT Smart Bin Ultrasonic Fill-Level Telemetry",
         "Connect low-cost ultrasonic IoT sensors (LoRaWAN / ESP32 MQTT) mounted on public dumpsters. Live fill levels (0-100%) are visualized on municipal GIS heatmaps, automatically dispatching collection squads before bins overflow onto roads."),

        ("7. Municipal CCTV & Dashcam Stream Ingestion",
         "Continuous or interval-based frame extraction from existing traffic CCTV cameras and sanitation vehicle dashcams. Computer Vision models automatically detect roadside garbage mounds and illegal dumping without requiring manual citizen reporting."),

        ("8. Geo-Fenced Mobile App for Sanitation Squads with EXIF Tamper-Proofing",
         "Field crew mobile app enforcing strict GPS geo-fencing: 'After' cleanup photos can only be shot when the worker's device is physically within a 30m radius of the complaint coordinates, validating EXIF metadata to prevent gallery uploads."),

        ("9. Registered Scrap Dealer (Kabadiwala) & Recycler Network Integration",
         "Connect citizens and municipal sorting yards with registered local recyclers and scrap dealers (Kabadiwalas). Recyclable dry plastics, electronics, and metals are routed for doorstep monetization, keeping recyclables out of municipal landfills."),

        ("10. Carbon Footprint & Methane Emission Predictor",
         "A mathematical environmental impact model calculating estimated greenhouse gas emissions (CO2e & CH4) averted by timely waste removal. Displays individual citizen environmental impact scores and municipal sustainability indices."),

        ("11. Drone Aerial Survey Processing for Open Landfills & Riverbanks",
         "Upload and stitch high-resolution aerial drone orthomosaics over open landfills, railway corridors, and riverbanks. Automated image segmentation identifies unmonitored plastic dumping and hazardous bio-sludge."),

        ("12. Predictive Waste Buildup Forecasting Engine",
         "Machine Learning time-series model (Prophet / LSTM) forecasting future waste surge patterns based on historical complaint volumes, festival calendars (Diwali, Ganesh Utsav), market schedules, and seasonal weather trends."),

        ("13. Public Swachh Ward Leaderboards & Open Civic Data API",
         "A public transparency portal and open REST/GraphQL API for citizens, NGOs, and researchers to view real-time ward response times, MTTR, and cleanliness rankings, promoting healthy inter-ward competition."),

        ("14. Community 'Adopt-a-Spot' & Corporate CSR Sponsorship Portal",
         "Empower Resident Welfare Associations (RWAs) and corporate CSR programs to adopt cleared chronic dump sites, funding their transformation into landscaped micro-parks or tree plantations with public donor recognition.")
    ]

    for title, desc in unique_features:
        u_block = [
            Paragraph(f"<b>{title}</b>", h2_style),
            Paragraph(desc, body_style),
            Spacer(1, 2)
        ]
        story.append(KeepTogether(u_block))

    story.append(Spacer(1, 5))

    # =========================================================================
    # SUMMARY TABLE
    # =========================================================================
    story.append(Paragraph("System Capability Comparison Summary", h1_style))
    summary_headers = [
        Paragraph("<b>Category / Domain</b>", table_header_style),
        Paragraph("<b>Features Already Developed (Operational)</b>", table_header_style),
        Paragraph("<b>Features to Develop (Innovation Roadmap)</b>", table_header_style)
    ]

    summary_rows = [
        summary_headers,
        [
            Paragraph("<b>AI &amp; Vision</b>", table_cell_bold),
            Paragraph("YOLOv8 dual model (plastic &amp; biomedical), bounding boxes, 25+ classes, CPCB stream mapping, volume &amp; weight math.", table_cell_style),
            Paragraph("AI Cleanup Fraud Detection (SSIM/Siamese), On-device offline Edge AI, CCTV stream analysis, Drone survey mapping.", table_cell_style)
        ],
        [
            Paragraph("<b>Citizen Access</b>", table_cell_bold),
            Paragraph("3-step wizard, sample testing suite, animated HUD, GPS Leaflet pin, reverse geocoding, ticket tracking, Before/After slider.", table_cell_style),
            Paragraph("WhatsApp / Telegram reporting bot, Bhashini 12-language voice grievance reporting, Community 'Adopt-a-Spot'.", table_cell_style)
        ],
        [
            Paragraph("<b>Triage &amp; SLA</b>", table_cell_bold),
            Paragraph("5-factor priority formula (0-100), automated node-cron SLA engine, auto-escalation to Critical, priority history.", table_cell_style),
            Paragraph("Predictive waste accumulation AI forecasting (Prophet/LSTM based on festivals, market days, and seasons).", table_cell_style)
        ],
        [
            Paragraph("<b>GIS &amp; Logistics</b>", table_cell_bold),
            Paragraph("50m Haversine duplicate clustering, chronic recurring dump detection, interactive Leaflet ward heatmaps.", table_cell_style),
            Paragraph("Dynamic garbage truck route optimization (VRP/TSP), IoT ultrasonic smart bin fill telemetry, Geo-fenced staff app.", table_cell_style)
        ],
        [
            Paragraph("<b>Civic Rewards &amp; Impact</b>", table_cell_bold),
            Paragraph("Green Points wallet, 5 progression tiers, transaction ledger, municipal vouchers (transit passes, utility rebates).", table_cell_style),
            Paragraph("Carbon footprint &amp; methane emission predictor, Kabadiwala/Scrap dealer commercialization network, CSR sponsorship.", table_cell_style)
        ],
        [
            Paragraph("<b>Governance &amp; Comms</b>", table_cell_bold),
            Paragraph("Municipal Watch, MTTR analytics, RBAC, audit logs, Socket.io real-time alerts, SMS gateway integration.", table_cell_style),
            Paragraph("Public Swachh Ward rankings, open civic data API for researchers/journalists, digital certificates.", table_cell_style)
        ]
    ]

    sum_table = Table(summary_rows, colWidths=[85, 200, 202])
    sum_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 3.5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(KeepTogether([sum_table]))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    abs_path = os.path.abspath(filename)
    print(f"[SUCCESS] PDF generated successfully at: {abs_path}")
    return abs_path

if __name__ == '__main__':
    output = "CleanTrack_Features_and_Roadmap.pdf"
    if len(sys.argv) > 1:
        output = sys.argv[1]
    build_pdf(output)
