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
        self.drawString(102, 804, "— AI-Powered Civic Cleanliness & Waste Intelligence Platform")
        self.drawRightString(541, 804, "Technical Project Report")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(54, 796, 541, 796)

        # Running Bottom Footer
        self.line(54, 44, 541, 44)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(54, 32, "Smart India Hackathon (SIH) Technical Submission | Confidential & Proprietary")
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(541, 32, page_text)
        
        self.restoreState()

def build_pdf(filename="CleanTrack_Comprehensive_Project_Report.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=54,
        rightMargin=54,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Professional Palette definition
    PRIMARY = colors.HexColor("#0f766e")       # Deep Teal / Emerald
    PRIMARY_DARK = colors.HexColor("#115e59")  # Dark Teal
    PRIMARY_LIGHT = colors.HexColor("#f0fdfa") # Teal Tint
    SECONDARY = colors.HexColor("#1e293b")     # Slate Dark
    ACCENT_BLUE = colors.HexColor("#0284c7")   # Ocean Blue
    ACCENT_AMBER = colors.HexColor("#d97706")  # Amber Alert
    BORDER_COLOR = colors.HexColor("#cbd5e1")  # Slate Border
    BG_LIGHT = colors.HexColor("#f8fafc")      # Off-white / light slate
    TEXT_DARK = colors.HexColor("#0f172a")     # Very dark slate
    TEXT_MUTED = colors.HexColor("#475569")    # Muted slate

    # Typography Styles
    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=22,
        leading=27,
        textColor=PRIMARY,
        spaceAfter=6
    )
    
    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=SECONDARY,
        spaceAfter=10
    )

    cover_meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=13,
        textColor=TEXT_MUTED
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'Heading2_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=SECONDARY,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=PRIMARY_DARK,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=TEXT_DARK,
        spaceAfter=4
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
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
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e3a8a")
    )

    story = []

    # =========================================================================
    # COVER / TITLE BANNER
    # =========================================================================
    banner_data = [
        [
            Paragraph("<b>CLEANTRACK PLATFORM — TECHNICAL REPORT</b>", ParagraphStyle('Badge', fontName='Helvetica-Bold', fontSize=8.5, textColor=PRIMARY, backColor=PRIMARY_LIGHT, spaceAfter=3)),
        ],
        [
            Paragraph("AI-Powered Civic Cleanliness &amp; Waste Intelligence Operating System", cover_title_style)
        ],
        [
            Paragraph("A Closed-Loop Urban Cleanliness Platform Connecting Citizens, Field Sanitation Squads, and Municipal Authorities with Deep Learning Computer Vision, Automated SLA Enforcement, and GIS Spatial Intelligence.", cover_subtitle_style)
        ],
        [
            HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=2, spaceAfter=6)
        ],
        [
            Paragraph(
                "<b>Initiative:</b> Smart India Hackathon (SIH) Technical Submission<br/>"
                "<b>Architecture:</b> 3-Tier Enterprise Web Platform &bull; Modular MVC Services &bull; Edge AI Vision<br/>"
                "<b>Primary Stack:</b> React 19, Vite, Tailwind CSS, Node.js, Express.js, MongoDB Geospatial, YOLOv8, Socket.io<br/>"
                "<b>Regulatory Compliance:</b> CPCB &amp; WHO Biomedical Waste Management Rules, Smart Cities Mission Guidelines",
                cover_meta_style
            )
        ]
    ]

    banner_table = Table(banner_data, colWidths=[487])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 8))

    # =========================================================================
    # 1. EXECUTIVE SUMMARY & SYSTEM OVERVIEW
    # =========================================================================
    story.append(Paragraph("1. Executive Summary &amp; Urban Sanitation Context", h1_style))
    story.append(Paragraph(
        "Municipal solid waste management in rapidly expanding urban centers faces profound structural challenges: <b>(1)</b> Unstructured, vague civic complaints lacking actionable geolocation coordinates or material categorization; <b>(2)</b> Dangerous co-mingling of infectious biomedical waste (syringes, needles, contaminated swabs) with general dry municipal garbage; <b>(3)</b> Redundant dispatches of multiple sanitation crews to identical locations; <b>(4)</b> Absence of verifiable ground-level post-cleanup audits; and <b>(5)</b> Unmonitored, unenforced Service Level Agreements (SLAs) resulting in administrative inertia.",
        body_style
    ))
    story.append(Paragraph(
        "<b>CleanTrack</b> introduces an automated, closed-loop urban cleanliness operating system that addresses these challenges. Citizens report waste through an AI-guided interface with automated GPS geolocation. CleanTrack's dual <b>YOLOv8 Computer Vision Ensemble</b> performs instantaneous neural inference to classify waste categories, compute exact camera frame coverage percentages, segregate biohazards according to <b>CPCB &amp; WHO statutory rules</b>, and assign an automated 5-factor priority score. Unresolved grievances are escalated automatically by a background SLA cron worker, while field cleanup authenticity is verified through an interactive photographic comparison slider rewarding citizens with Green Points.",
        body_style
    ))

    # Closed-Loop Callout Box
    diag_data = [[
        Paragraph(
            "<b>The Closed-Loop Cleanliness Lifecycle:</b><br/>"
            "<b>[1. Citizen Capture]</b> Live camera photo + GPS coordinate pinpoint &rarr;<br/>"
            "<b>[2. AI Vision Scan]</b> Dual YOLOv8 polymer &amp; clinical sharps detection &rarr;<br/>"
            "<b>[3. Intelligent Triage]</b> 5-factor mathematical scoring &amp; SLA deadline calculation &rarr;<br/>"
            "<b>[4. Squad Dispatch]</b> Specialized team assignment (Plastic Compactor / Biohazard Sharps) &rarr;<br/>"
            "<b>[5. Field Cleanup]</b> Field sanitation squad uploads 'After' photographic proof &rarr;<br/>"
            "<b>[6. Citizen Verification]</b> Citizen validates cleanup via interactive split-view slider &rarr;<br/>"
            "<b>[7. Green Points Ledger]</b> Gamified citizen rewards &amp; municipal performance index update.",
            callout_style
        )
    ]]
    diag_table = Table(diag_data, colWidths=[487])
    diag_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor("#bfdbfe")),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(diag_table)
    story.append(Spacer(1, 8))

    # =========================================================================
    # 2. MODULE-BY-MODULE FUNCTIONAL BREAKDOWN
    # =========================================================================
    story.append(Paragraph("2. Comprehensive Module Breakdown", h1_style))
    story.append(Paragraph(
        "CleanTrack is architected into 10 decoupled, highly cohesive modules spanning citizen reporting, computer vision inference, operational triage, municipal governance, and macro-level urban analytics.",
        body_style
    ))

    modules = [
        ("Module 1: Citizen Engagement & Smart Complaint Reporting",
         "Enables citizens to lodge actionable civic grievances in under 30 seconds. Features browser-native GPS coordinate capture, reverse geocoding to municipal ward numbers and landmarks, local image selection/camera capture, real-time client-side pre-scan visualizers, and a live complaint tracker tracing status from submission to citizen sign-off.",
         "React 19, React Router DOM 7, HTML5 Geolocation API, Leaflet GIS, Lucide Icons, Multer, Express.js REST API"),

        ("Module 2: AI Computer Vision & Deep Learning Waste Classification Engine",
         "A multi-model deep learning inference subsystem. Orchestrates two fine-tuned YOLOv8 convolutional neural networks (plastic_best.pt and biomedical_best.pt). Identifies 25+ waste classes (PET, HDPE containers, LDPE films, PP rigids, syringes, hypodermic needles, surgical gloves, soiled bandages, test tubes), performs Non-Maximum Suppression (NMS) and IoU de-overlapping, calculates exact surface area coverage %, assigns WHO/CPCB segregation streams, and renders annotated visual bounding boxes.",
         "Ultralytics YOLOv8, PyTorch, Python 3.10+, OpenCV (cv2), Pillow (PIL), NumPy, Node.js Child Process IPC"),

        ("Module 3: Intelligent Triage, Priority Scoring & Dynamic SLA Escalation",
         "Eliminates manual grievance prioritization. Evaluates incoming complaints against a 5-factor scoring model: Waste Hazard (30%), Visual Extent (30%), Location Sensitivity (25%), Chronic Recurrence (10%), and Time Elapsed (5%). Computes a 0-100 score and assigns strict SLA resolution deadlines (Critical = 12h, High/Medium = 24h, Normal = 48h). A background cron engine automatically escalates overdue tickets to CRITICAL, appends priority history, records an audit log, and pushes emergency alarms.",
         "node-cron, Node.js, Express Services, MongoDB Mongoose Schemas, Socket.io Real-Time Broadcast"),

        ("Module 4: GIS Spatial Mapping, Duplicate Clustering & Hotspot Analytics",
         "Utilizes MongoDB 2dsphere spherical geometry indexes to identify duplicate complaints within a 50-meter radius, preventing redundant crew dispatches. Aggregates complaint spatial coordinates to detect chronic waste hotspots (>=3 reports in 14 days) and renders interactive color-coded ward heatmaps.",
         "Leaflet.js, React-Leaflet, MongoDB Geospatial Indexing ($geoNear, 2dsphere), Tailwind CSS"),

        ("Module 5: Municipal Operations, Field Dispatch & Squad Assignment",
         "Operational command center for municipal zonal triage officers. Features a live Priority Queue sorted by SLA countdown, a Quick-Assign Dispatch Modal to allocate specialized response teams (Squad Alpha: Plastic Compactor, Squad Bravo: Biohazard Sharps Unit, Squad Charlie: Organic Composting), and squad instruction broadcasting.",
         "React 19 Context API, Mongoose Relational Population (ObjectId), Express.js REST APIs"),

        ("Module 6: Civic Cleanup Verification & Before/After Visual Audit",
         "Guarantees ground-level cleanup authenticity. Sanitation crews must upload an on-site 'After' photograph to complete an assignment. Citizens interact with a side-by-side Before/After comparison slider to validate or reject the cleanup. Verified cleanups automatically credit +50 Green Points and trigger celebratory animations.",
         "Custom React Touch/Mouse Drag Slider, Express Verification Controller, canvas-confetti"),

        ("Module 7: Gamification, Green Points Ledger & Citizen Rewards Center",
         "Incentivizes sustained civic participation. Citizens earn points for legitimate reports (+25 pts) and confirmed cleanups (+50 pts). Features 5 progression tiers (Eco Rookie to Clean City Champion), dynamic progress bars, and an immutable financial-grade transaction ledger for redeeming public transport vouchers and utility rebates.",
         "MongoDB Reward & Transaction Schema, React UI Components, Custom Gamification Engine"),

        ("Module 8: Administrative Governance, Municipal Watch & RBAC Security",
         "Empowers city municipal commissioners with high-level governance. Enforces strict Role-Based Access Control (RBAC) across Citizen, Municipal Staff, and Administrator roles. The Municipal Watch page monitors ward-by-ward Mean Time to Resolve (MTTR), squad workload, staff KPI leaderboards, and immutable system audit logs.",
         "JSON Web Tokens (JWT), Bcrypt.js Password Hashing, Express Auth & Role Middleware"),

        ("Module 9: Real-Time Event Dispatch & In-App Notification Hub",
         "Bi-directional event streaming infrastructure. Dispatches instantaneous push notifications for ticket assignments, SLA breach warnings, cleanup confirmations, and reward credits without page refreshes. Persists historical notifications with read/unread statuses.",
         "Socket.io (WebSocket Client & Server), Notification Model, React Notification Context"),

        ("Module 10: Executive Analytics, Telemetry & Clean City Pulse Engine",
         "Macro-level urban intelligence dashboard. Calculates the Clean City Pulse Score (0-100 composite index) based on resolution speed, SLA compliance, and open hotspot density. Generates interactive visual breakdowns of monthly complaint trends, waste type distributions, and AI model inference latency telemetry.",
         "Recharts 3 SVG Charting Library, MongoDB Aggregation Pipelines ($group, $match, $facet)")
    ]

    for mod_title, mod_desc, mod_tech in modules:
        m_data = [
            [Paragraph(f"<b>{mod_title}</b>", h2_style)],
            [Paragraph(f"<b>Functionality &amp; Capabilities:</b> {mod_desc}", body_style)],
            [Paragraph(f"<b>Technologies Employed:</b> <font color='{PRIMARY.hexval()}'><b>{mod_tech}</b></font>", body_style)]
        ]
        m_table = Table(m_data, colWidths=[487])
        m_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.white),
            ('BOX', (0,0), (-1,-1), 0.75, BORDER_COLOR),
            ('PADDING', (0,0), (-1,-1), 4.5),
        ]))
        story.append(KeepTogether([m_table, Spacer(1, 4)]))

    # =========================================================================
    # 3. TECHNOLOGY MATRIX
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("3. Complete Technology Stack Matrix", h1_style))
    story.append(Paragraph(
        "CleanTrack utilizes a modern, production-grade technology ecosystem engineered for low-latency responsiveness, high concurrency, strict security, and real-time computer vision inference.",
        body_style
    ))

    tech_matrix_header = [
        Paragraph("<b>Domain / Layer</b>", table_header_style),
        Paragraph("<b>Technology</b>", table_header_style),
        Paragraph("<b>Version</b>", table_header_style),
        Paragraph("<b>Role &amp; Architectural Function in CleanTrack</b>", table_header_style)
    ]

    tech_matrix_rows = [
        tech_matrix_header,
        [Paragraph("Frontend Framework", table_cell_bold), Paragraph("React.js", table_cell_style), Paragraph("19.2.x", table_cell_style), Paragraph("Component-based UI architecture, virtual DOM reconciliation, state reactivity, and multi-role workspace management", table_cell_style)],
        [Paragraph("Build Engine", table_cell_bold), Paragraph("Vite", table_cell_style), Paragraph("8.2.x", table_cell_style), Paragraph("Next-gen ESM development server, sub-second Hot Module Replacement (HMR), and optimized production bundling", table_cell_style)],
        [Paragraph("UI Styling", table_cell_bold), Paragraph("Tailwind CSS", table_cell_style), Paragraph("3.4.x", table_cell_style), Paragraph("Utility-first responsive styling, glassmorphism card surfaces, and color-coded CPCB waste stream design tokens", table_cell_style)],
        [Paragraph("Client Routing", table_cell_bold), Paragraph("React Router DOM", table_cell_style), Paragraph("7.18.x", table_cell_style), Paragraph("Declarative SPA routing, protected route guards, role barrier redirects, and layout encapsulation", table_cell_style)],
        [Paragraph("Geospatial GIS", table_cell_bold), Paragraph("Leaflet &amp; React-Leaflet", table_cell_style), Paragraph("1.9.4 / 5.0", table_cell_style), Paragraph("Interactive city ward maps, draggable coordinate pin selectors, and color-coded hotspot clusters", table_cell_style)],
        [Paragraph("Data Visualization", table_cell_bold), Paragraph("Recharts", table_cell_style), Paragraph("3.10.x", table_cell_style), Paragraph("Composable SVG charts, complaint trend curves, category distributions, and Clean City Pulse gauges", table_cell_style)],
        [Paragraph("Vector Icons & FX", table_cell_bold), Paragraph("Lucide React &amp; Confetti", table_cell_style), Paragraph("Latest", table_cell_style), Paragraph("Lightweight vector icons and celebratory canvas particle animations upon cleanup validation", table_cell_style)],
        [Paragraph("Backend Runtime", table_cell_bold), Paragraph("Node.js", table_cell_style), Paragraph("v20+ / v22", table_cell_style), Paragraph("Asynchronous, event-driven JavaScript server runtime for high-throughput non-blocking operations", table_cell_style)],
        [Paragraph("Web Server Framework", table_cell_bold), Paragraph("Express.js", table_cell_style), Paragraph("4.21.x", table_cell_style), Paragraph("Modular RESTful API routing, MVC controllers, middleware chaining, and centralized error handling", table_cell_style)],
        [Paragraph("Database Layer", table_cell_bold), Paragraph("MongoDB", table_cell_style), Paragraph("8.x / Atlas", table_cell_style), Paragraph("Document-oriented NoSQL storage with native GeoJSON spherical geometry indexing for spatial queries", table_cell_style)],
        [Paragraph("Data Modeling (ODM)", table_cell_bold), Paragraph("Mongoose", table_cell_style), Paragraph("8.10.x", table_cell_style), Paragraph("Schema validation, strict typings, 2dsphere indexes, pre-save hooks, and ObjectId relational population", table_cell_style)],
        [Paragraph("Real-Time WebSockets", table_cell_bold), Paragraph("Socket.io", table_cell_style), Paragraph("4.8.x", table_cell_style), Paragraph("Bi-directional, event-driven WebSocket communication for instantaneous live alarms and status sync", table_cell_style)],
        [Paragraph("Background Cron Engine", table_cell_bold), Paragraph("Node-Cron", table_cell_style), Paragraph("3.0.x", table_cell_style), Paragraph("Background task scheduler continuously evaluating and escalating breached SLA complaint deadlines", table_cell_style)],
        [Paragraph("AI / ML Framework", table_cell_bold), Paragraph("Ultralytics YOLOv8", table_cell_style), Paragraph("8.x", table_cell_style), Paragraph("Dual custom neural network models for real-time plastic and biomedical waste detection", table_cell_style)],
        [Paragraph("Deep Learning Core", table_cell_bold), Paragraph("PyTorch &amp; Python", table_cell_style), Paragraph("3.10+ / 2.x", table_cell_style), Paragraph("Neural network tensor execution, model weight processing (best.pt), and GPU-accelerated inference", table_cell_style)],
        [Paragraph("Image Processing", table_cell_bold), Paragraph("OpenCV, PIL, NumPy", table_cell_style), Paragraph("Latest", table_cell_style), Paragraph("Image decoding, bounding box rendering, IoU duplicate box suppression, and area math", table_cell_style)],
        [Paragraph("Auth & Cryptography", table_cell_bold), Paragraph("JWT &amp; Bcrypt.js", table_cell_style), Paragraph("9.0.x / 2.4.x", table_cell_style), Paragraph("Stateless token authorization and 10-round salted one-way password hashing", table_cell_style)],
        [Paragraph("API Security", table_cell_bold), Paragraph("Helmet &amp; Rate-Limit", table_cell_style), Paragraph("Latest", table_cell_style), Paragraph("HTTP security headers, XSS mitigation, and IP-based endpoint throttling against brute force", table_cell_style)],
        [Paragraph("File Multipart Upload", table_cell_bold), Paragraph("Multer", table_cell_style), Paragraph("1.4.x", table_cell_style), Paragraph("Local disk storage and memory buffering of incoming photographic complaint evidence", table_cell_style)]
    ]

    tech_table = Table(tech_matrix_rows, colWidths=[92, 85, 45, 265])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(KeepTogether([tech_table]))
    story.append(Spacer(1, 8))

    # =========================================================================
    # 4. IN-DEPTH TECHNICAL DEEP DIVES FOR EVERY TECHNOLOGY
    # =========================================================================
    story.append(Paragraph("4. In-Depth Architectural Deep Dives of Core Technologies", h1_style))

    tech_deep_dives = [
        ("1. React 19 (Frontend Presentation Framework)",
         "React 19 forms the core foundation of CleanTrack's user interface. It utilizes a declarative component model where UI elements are encapsulated into reusable units such as Complaint Cards, AI Scanners, and Before/After Sliders. React 19's optimized virtual DOM reconciliation ensures instantaneous UI updates when WebSocket events arrive. In CleanTrack, the frontend is organized into 4 distinct layout zones: Public Informational routes, Citizen Workspace, Municipal Staff Triage Center, and Executive Administration Dashboard."),

        ("2. Vite 8.2 (Next-Generation Frontend Build Engine)",
         "Vite provides the development and build infrastructure for CleanTrack. Unlike traditional bundlers that pre-bundle entire applications before serving, Vite serves source code over native browser ES Modules (ESM), providing sub-second dev server start times and instantaneous Hot Module Replacement (HMR). During production compilation, Vite leverages Rollup to tree-shake unused code and output highly optimized, cache-busted static assets."),

        ("3. Tailwind CSS 3.4 (Utility-First Responsive Styling)",
         "Tailwind CSS is an atomic CSS framework that eliminates bulky custom stylesheets by providing utility classes directly within JSX. CleanTrack leverages Tailwind to create a unified design system with semantic color tokens corresponding to CPCB waste streams (Yellow for biohazard incineration, Red for autoclave plastics, Blue for glassware, Amber for SLA alerts). Tailwind's responsive breakpoints ensure full operational usability across desktop monitors, field tablets, and citizen smartphones."),

        ("4. Leaflet.js & React-Leaflet (Geospatial GIS Engine)",
         "Leaflet is a lightweight open-source JavaScript library for interactive mapping. React-Leaflet provides idiomatic React bindings for Leaflet's map instances. In CleanTrack, Leaflet renders OpenStreetMap tile layers, custom SVG markers with animated severity halos, interactive radius overlays, and draggable location pickers with automated latitude/longitude binding."),

        ("5. Recharts 3.10 (Declarative SVG Data Visualization)",
         "Recharts is a charting library built natively on React and D3.js, rendering pure Scalable Vector Graphics (SVG). CleanTrack employs Recharts to visualize civic metrics: weekly complaint volume trends, ward-by-ward resolution velocities, waste composition breakdowns, and the composite Clean City Pulse radial gauge."),

        ("6. Node.js & Express.js 4.21 (Backend REST & Services Architecture)",
         "Node.js executes JavaScript on Chrome's V8 engine using an asynchronous, non-blocking I/O event loop. Express.js organizes CleanTrack into a structured 3-tier architecture: (1) HTTP Routes, (2) Controllers executing business validation, and (3) Reusable Services (aiService, escalationService, rewardService, notificationService). This ensures complete separation of concerns and maintainability."),

        ("7. MongoDB 8 & Mongoose 8.10 (Geospatial NoSQL Database & ODM)",
         "MongoDB stores records as flexible JSON-like BSON documents. Mongoose enforces strict schema typings, validation rules, and relational ObjectIds. CleanTrack implements a <b>2dsphere geospatial index</b> on the Complaint collection, enabling sub-millisecond execution of spherical geometry queries ($geoNear with maxDistance: 50m) to immediately detect and cluster duplicate complaints."),

        ("8. Socket.io 4.8 (Bi-Directional Real-Time WebSocket Infrastructure)",
         "Socket.io establishes persistent, low-latency WebSocket connections between web clients and the backend server. CleanTrack uses Socket.io to broadcast live events across dedicated rooms. When a citizen submits a critical complaint or an SLA breaches, municipal staff dashboards update in real time with acoustic and visual alerts without requiring manual page refreshes."),

        ("9. Node-Cron 3.0 (Automated SLA Background Engine)",
         "Node-Cron executes scheduled cron jobs inside the Node.js process using standard POSIX crontab syntax. CleanTrack runs an automated SLA watchdog every 60 seconds (*/1 * * * *). The job checks for unresolved complaints where dueAt < NOW, automatically elevates their priority to CRITICAL, logs an immutable audit entry, and broadcasts emergency escalation alerts."),

        ("10. Ultralytics YOLOv8 & PyTorch (Computer Vision & Deep Learning)",
         "YOLOv8 (You Only Look Once v8) is a state-of-the-art Single-Shot Object Detector that processes images in a single forward pass. CleanTrack orchestrates a dual-model ensemble: (1) A specialized <b>Plastic Polymer Model</b> trained on diverse PET, HDPE, LDPE, and composite packaging; and (2) A <b>Biomedical Waste Model</b> trained on WHO/CPCB medical classes (syringes, needles, gauze, gloves, test tubes). The Python inference engine executes Non-Maximum Suppression (NMS), computes area coverage fractions, and yields structured JSON telemetry alongside annotated visual bounding boxes in ~140ms."),

        ("11. OpenCV, Pillow (PIL) & NumPy (Computer Vision Preprocessing & Math)",
         "OpenCV and PIL handle on-the-fly image decoding, aspect-ratio scaling, and bounding box visualization. NumPy executes high-speed matrix operations to calculate Intersection-over-Union (IoU) matrices, suppressing overlapping duplicate bounding boxes and computing exact spatial coverage fractions across camera frames."),

        ("12. JWT & Bcrypt.js (Stateless Authentication & Cryptographic Security)",
         "CleanTrack ensures robust stateless security using signed JSON Web Tokens (HMAC-SHA256). Passwords are encrypted using Bcrypt.js with an adaptive work factor of 10 salt rounds. Role-Based Access Control (RBAC) middleware intercepts every API route, ensuring citizens cannot access municipal dispatch queues and staff cannot modify administrative system configurations."),

        ("13. Helmet & Express-Rate-Limit (Web Application Protection)",
         "Helmet configures critical HTTP response security headers (Content Security Policy, X-Frame-Options, X-XSS-Protection). Express-Rate-Limit enforces request limits on public endpoints to protect against brute-force attacks and Denial of Service (DoS)."),

        ("14. Multer (Multipart Form Data & File Handling)",
         "Multer is an Express middleware that handles multipart/form-data uploads. It buffers incoming photographic evidence, validates MIME types, and streams files directly to disk storage or cloud storage buckets.")
    ]

    for tech_name, tech_body in tech_deep_dives:
        t_block = [
            Paragraph(f"<b>{tech_name}</b>", h3_style),
            Paragraph(tech_body, body_style),
            Spacer(1, 2)
        ]
        story.append(KeepTogether(t_block))

    # =========================================================================
    # 5. MATHEMATICAL MODELS & CORE ALGORITHMS
    # =========================================================================
    story.append(Spacer(1, 6))
    story.append(Paragraph("5. Mathematical Models &amp; Core Algorithms", h1_style))

    # Formula 1: Priority Score
    f1_data = [
        [Paragraph("<b>1. Multi-Factor AI Priority Score Algorithm (0 to 100 Scale)</b>", h2_style)],
        [Paragraph(
            "Every complaint is evaluated by an automated multi-parametric scoring formula that balances hazard danger with visual severity and community context:<br/>"
            "<b>Priority Score = W_type + V_extent + L_sensitivity + R_recurrence + T_time</b><br/>"
            "&bull; <b>Waste Type Hazard (W_type, Max 30 pts):</b> Syringes/Sharps = 30 pts; Bio-contaminated Cotton/Bandages = 22 pts; Plastic/Packaging = 12-18 pts; Clean = 0 pts.<br/>"
            "&bull; <b>Visual Area Coverage (V_extent, Max 30 pts):</b> Calculated directly from YOLO bounding box pixel dimensions: <code>min(30, 18 + Coverage% * 0.2 + ItemCount * 0.5)</code>.<br/>"
            "&bull; <b>Location Sensitivity (L_sensitivity, Max 25 pts):</b> Hospital/School zone = 25 pts; Commercial/Market = 20 pts; Residential = 15 pts; Open Suburban = 10 pts.<br/>"
            "&bull; <b>Chronic Recurrence Factor (R_recurrence, Max 10 pts):</b> Evaluates historical complaints within 100m radius over past 30 days.<br/>"
            "&bull; <b>Time Elapsed Aging (T_time, Max 5 pts):</b> Incremental priority boost as SLA deadline nears expiration.",
            body_style
        )]
    ]
    f1_table = Table(f1_data, colWidths=[487])
    f1_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(KeepTogether([f1_table]))
    story.append(Spacer(1, 6))

    # Formula 2: Duplicate Clustering & Clean City Pulse
    f2_data = [
        [Paragraph("<b>2. Geospatial Duplicate Detection &amp; Clean City Pulse Index</b>", h2_style)],
        [Paragraph(
            "&bull; <b>50-Meter Haversine Geospatial Duplicate Clustering:</b><br/>"
            "<code>Distance(P1, P2) = 2R * arcsin(sqrt(sin^2(d_phi/2) + cos(phi1)*cos(phi2)*sin^2(d_lambda/2))) <= 0.050 km</code><br/>"
            "Executed natively inside MongoDB via <code>$geoNear</code> with spherical geometry coordinates. If an active, unresolved complaint is discovered within 50m, the new submission is linked as a corroborating duplicate report.<br/><br/>"
            "&bull; <b>Clean City Pulse Composite Formula (0 to 100 Index):</b><br/>"
            "<b>Clean City Pulse = (Resolution_Rate * 0.45) + (SLA_Adherence * 0.35) + (Hotspot_Control * 0.20)</b><br/>"
            "Provides city commissioners with an objective, real-time index of municipal sanitation health.",
            body_style
        )]
    ]
    f2_table = Table(f2_data, colWidths=[487])
    f2_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(KeepTogether([f2_table]))
    story.append(Spacer(1, 6))

    # =========================================================================
    # 6. DATABASE SCHEMA & DATA MODELS
    # =========================================================================
    story.append(Paragraph("6. Database Architecture &amp; Key Data Models", h1_style))
    story.append(Paragraph(
        "CleanTrack implements 10 relational Mongoose schemas in MongoDB designed for ACID transaction safety, relational consistency, and rapid indexed spatial queries.",
        body_style
    ))

    schema_headers = [
        Paragraph("<b>Model Name</b>", table_header_style),
        Paragraph("<b>Primary Fields &amp; Schema Types</b>", table_header_style),
        Paragraph("<b>Key Indexes &amp; Relations</b>", table_header_style)
    ]

    schema_rows = [
        schema_headers,
        [Paragraph("<b>User</b>", table_cell_bold), Paragraph("name, email, passwordHash, role (citizen / municipal_staff / administrator), phone, ward, greenPoints, avatar", table_cell_style), Paragraph("unique(email), index(role, ward)", table_cell_style)],
        [Paragraph("<b>Complaint</b>", table_cell_bold), Paragraph("complaintId, title, description, imageUrl, location (GeoJSON Point), ward, landmark, aiCategory, aiSubtype, aiConfidence, aiPriorityScore, severity, status, sla (dueAt, breached), priorityHistory", table_cell_style), Paragraph("2dsphere(location.coordinates), index(status), index(sla.dueAt), ref(reportedBy)", table_cell_style)],
        [Paragraph("<b>AIAnalysis</b>", table_cell_bold), Paragraph("complaintId, modelUsed, detections (classId, label, confidence, box), coveragePercent, segregationStream, rawResponseJson", table_cell_style), Paragraph("ref(complaintId), index(modelUsed)", table_cell_style)],
        [Paragraph("<b>Assignment</b>", table_cell_bold), Paragraph("complaintId, assignedSquadId, squadName, assignedBy, notes, specialInstructions, ppeChecklist, dispatchedAt, completedAt", table_cell_style), Paragraph("ref(complaintId), ref(assignedSquadId), index(status)", table_cell_style)],
        [Paragraph("<b>Verification</b>", table_cell_bold), Paragraph("complaintId, beforeImageUrl, afterImageUrl, submittedByStaff, citizenStatus (pending / approved / rejected), citizenNotes, verifiedAt", table_cell_style), Paragraph("ref(complaintId), index(citizenStatus)", table_cell_style)],
        [Paragraph("<b>Hotspot</b>", table_cell_bold), Paragraph("hotspotId, title, centerCoordinates (GeoJSON), radiusMeters, complaintCount, recurringSeverity, recommendedAction", table_cell_style), Paragraph("2dsphere(centerCoordinates), index(recurringSeverity)", table_cell_style)],
        [Paragraph("<b>Reward</b>", table_cell_bold), Paragraph("userId, pointsAwarded, transactionType (report_approved / cleanup_verified / voucher_redeemed), referenceComplaintId, balanceAfter", table_cell_style), Paragraph("ref(userId), index(createdAt)", table_cell_style)],
        [Paragraph("<b>Notification</b>", table_cell_bold), Paragraph("recipientId, title, message, type (complaint_update / sla_escalation / reward), isRead, deepLinkUrl", table_cell_style), Paragraph("ref(recipientId), index(isRead, createdAt)", table_cell_style)],
        [Paragraph("<b>SystemSetting</b>", table_cell_bold), Paragraph("slaThresholds (criticalHours, mediumHours, normalHours), duplicateRadiusMeters, autoEscalationEnabled", table_cell_style), Paragraph("singleton configuration document", table_cell_style)],
        [Paragraph("<b>AuditLog</b>", table_cell_bold), Paragraph("eventType, entityId, performedBy, oldState, newState, timestamp, ipAddress", table_cell_style), Paragraph("index(eventType, entityId, timestamp)", table_cell_style)]
    ]

    schema_table = Table(schema_rows, colWidths=[80, 267, 140])
    schema_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor("#e2e8f0")),
        ('PADDING', (0,0), (-1,-1), 3),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(KeepTogether([schema_table]))
    story.append(Spacer(1, 6))

    # =========================================================================
    # 7. REGULATORY COMPLIANCE, SOCIAL IMPACT & ROADMAP
    # =========================================================================
    story.append(Paragraph("7. Regulatory Compliance, Environmental Impact &amp; Future Roadmap", h1_style))
    story.append(Paragraph(
        "<b>1. CPCB &amp; WHO Biomedical Waste Rules Compliance:</b> India's Biomedical Waste Management Rules strictly mandate the segregated disposal of clinical sharps to prevent occupational bloodborne pathogens (HIV, Hepatitis B/C) among sanitation workers. CleanTrack automatically detects sharps and routes them to color-coded puncture-proof disposal channels.<br/>"
        "<b>2. Municipal Fleet &amp; Fuel Optimization:</b> 50-meter spatial duplicate clustering prevents redundant squad mobilizations, reducing municipal diesel consumption, vehicle wear, and carbon emissions.<br/>"
        "<b>3. Future Scalability Roadmap:</b><br/>"
        "&bull; <i>IoT Sensor Integration:</i> Ultrasonic bin fill-level telemetry syncing with CleanTrack dispatch routes.<br/>"
        "&bull; <i>Autonomous Drone Patrols:</i> Automated aerial surveys of open dump grounds, railway corridors, and riverbanks.<br/>"
        "&bull; <i>Multi-Lingual Voice Reporting:</i> Speech-to-text reporting in 12 Indian regional languages for universal civic accessibility.",
        body_style
    ))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] PDF Generated successfully: {os.path.abspath(filename)}")

if __name__ == '__main__':
    output_filename = "CleanTrack_Comprehensive_Project_Report.pdf"
    if len(sys.argv) > 1:
        output_filename = sys.argv[1]
    build_pdf(output_filename)
