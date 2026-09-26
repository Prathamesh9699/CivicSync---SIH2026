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
        self.drawString(102, 804, "- Workflow Specification & Module Actions Operating Manual")
        self.drawRightString(541, 804, "Technical Operations Report")
        
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


def build_pdf(filename="CleanTrack_Workflow_and_Module_Actions_Report.pdf"):
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
    ALERT_RED = colors.HexColor("#dc2626")     # Red
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
        leading=26,
        textColor=PRIMARY,
        spaceAfter=6
    )
    
    cover_subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=14,
        textColor=SECONDARY,
        spaceAfter=10
    )

    cover_meta_style = ParagraphStyle(
        'CoverMeta',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=12.5,
        textColor=TEXT_MUTED
    )

    h1_style = ParagraphStyle(
        'Heading1_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
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
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True
    )

    h3_style = ParagraphStyle(
        'Heading3_Custom',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.2,
        leading=11,
        textColor=PRIMARY_DARK,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.8,
        textColor=TEXT_DARK,
        spaceAfter=3
    )

    bullet_style = ParagraphStyle(
        'Bullet_Custom',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.6,
        leading=10.4,
        textColor=TEXT_DARK,
        leftIndent=8,
        spaceAfter=2
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.2,
        leading=9.2,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.8,
        leading=8.8,
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
        fontSize=7.6,
        leading=10.6,
        textColor=colors.HexColor("#1e3a8a")
    )

    callout_green = ParagraphStyle(
        'CalloutGreen',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.6,
        leading=10.6,
        textColor=colors.HexColor("#14532d")
    )

    story = []

    # =========================================================================
    # COVER PAGE (PAGE 1)
    # =========================================================================
    story.append(Spacer(1, 10))
    
    cover_box_data = [
        [
            Paragraph("<b>SMART INDIA HACKATHON (SIH) TECHNICAL DOCUMENTATION &bull; OPERATING MANUAL</b>", 
                      ParagraphStyle('CoverBadge', fontName='Helvetica-Bold', fontSize=8.5, textColor=PRIMARY, backColor=PRIMARY_LIGHT, spaceAfter=4))
        ],
        [
            Paragraph("CleanTrack: End-to-End Workflow Specification &amp; Comprehensive Module Actions Catalog", cover_title_style)
        ],
        [
            Paragraph(
                "A Complete Operational and Technical Reference Detailing the Closed-Loop Civic Cleanliness Workflow, "
                "AI-Powered Waste Triage Pipeline, Dynamic SLA Escalations, and Exhaustive User Action Inventories "
                "Across Citizen, Municipal Officer, Field Sanitation Squad, and City Administrator Modules.",
                cover_subtitle_style
            )
        ],
        [
            HRFlowable(width="100%", thickness=1.5, color=PRIMARY, spaceBefore=2, spaceAfter=6)
        ],
        [
            Paragraph(
                "<b>System Application:</b> CleanTrack Urban Waste Operating System &bull; <b>Version:</b> 2.4.0 (Production Build)<br/>"
                "<b>Target Domain:</b> Municipal Solid Waste (MSW), Biomedical Hazard Segregation &amp; E-Waste Tracking<br/>"
                "<b>Architecture Layer:</b> Multi-Tenant Role-Based Access Control (RBAC), Asynchronous Event-Driven Microservices<br/>"
                "<b>Underlying AI Engine:</b> YOLOv8 Deep Vision Ensemble + ViT Feature Extractor + Perceptual Duplicate Hash<br/>"
                "<b>Statutory Framework:</b> Swachh Bharat Mission (Urban 2.0), CPCB Solid &amp; Biomedical Waste Guidelines",
                cover_meta_style
            )
        ]
    ]

    cover_table = Table(cover_box_data, colWidths=[485])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, PRIMARY),
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    story.append(cover_table)
    story.append(Spacer(1, 12))

    # Executive Overview Card
    exec_summary_text = (
        "<b>Executive Summary &amp; Operational Paradigm:</b> CleanTrack solves the critical breakdown in traditional municipal "
        "grievance portals where complaints sit in unmonitored backlogs without actionable intelligence. CleanTrack implements an "
        "unbroken, automated digital chain-of-custody: <i>Citizen Photo Ingestion &rarr; Instant Multi-Modal Computer Vision Triage "
        "&rarr; 50-Meter Spatial Duplicate Merging &rarr; Dynamic Risk-Weighted SLA Generation &rarr; Municipal Resource &amp; Machine "
        "Allocation &rarr; Worker Route-Optimized Dispatch &rarr; Live Geo-Tagged After-Photo Proof &rarr; Supervisory Verification "
        "&rarr; Citizen Loop Closure with Gamified Green Points</i>. Every module features explicit, role-gated action flows designed "
        "for zero-friction civic engagement and strict municipal accountability."
    )
    exec_table = Table([[Paragraph(exec_summary_text, callout_style)]], colWidths=[485])
    exec_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1, ACCENT_BLUE),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 9),
        ('RIGHTPADDING', (0,0), (-1,-1), 9),
    ]))
    story.append(exec_table)
    story.append(Spacer(1, 10))

    # Document Structure Roadmap
    story.append(Paragraph("<b>Document Architecture &amp; Report Structure</b>", h2_style))
    doc_map_data = [
        [Paragraph("<b>Section</b>", table_header_style), Paragraph("<b>Coverage &amp; Technical Scope</b>", table_header_style), Paragraph("<b>Key Artifacts &amp; Diagrams</b>", table_header_style)],
        [Paragraph("<b>Section 1: Master Workflow</b>", table_cell_bold), Paragraph("End-to-end 9-phase operational lifecycle from initial photo snap to citizen rating and long-term recurrence mitigation.", table_cell_style), Paragraph("Closed-loop process pipeline &amp; phase specifications.", table_cell_style)],
        [Paragraph("<b>Section 2: Citizen Actions</b>", table_cell_bold), Paragraph("Complete user catalog: camera capture, GPS reverse geocoding, AI preview, tracking, resolution audit, and Green Points.", table_cell_style), Paragraph("9 granular citizen actions with step-by-step UI flows.", table_cell_style)],
        [Paragraph("<b>Section 3: Municipal Actions</b>", table_cell_bold), Paragraph("Triage officer actions: priority queues, spatial duplicate merging, recurring dumps, GIS mapping, squad dispatch, and QA.", table_cell_style), Paragraph("11 municipal staff actions with decision matrices.", table_cell_style)],
        [Paragraph("<b>Section 4: Field Worker Actions</b>", table_cell_bold), Paragraph("Sanitation squad actions: shift check-in, hazard briefing, navigation, clearance execution, and geo-tagged proof photo upload.", table_cell_style), Paragraph("8 field execution actions with safety checklists.", table_cell_style)],
        [Paragraph("<b>Section 5: Admin &amp; Public</b>", table_cell_bold), Paragraph("Commissioner oversight, ward benchmarking, user RBAC, AI monitoring, public transparency, and automated background daemons.", table_cell_style), Paragraph("City command oversight &amp; background cron engine.", table_cell_style)],
        [Paragraph("<b>Section 6: State Lifecycle</b>", table_cell_bold), Paragraph("Cross-module state transition matrix, event triggers, failure handling, and full database entity models.", table_cell_style), Paragraph("State machine table &amp; schema reference.", table_cell_style)],
    ]
    doc_map_table = Table(doc_map_data, colWidths=[110, 245, 130])
    doc_map_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(doc_map_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 1: MASTER END-TO-END WORKFLOW REPORT
    # =========================================================================
    story.append(Paragraph("1. Master End-to-End Civic Cleanliness Workflow", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=6))
    
    story.append(Paragraph(
        "The CleanTrack operational lifecycle establishes an automated, closed-loop civic governance pipeline. "
        "Unlike legacy portals that treat citizen submissions as unstructured static text tickets, CleanTrack passes "
        "every report through computer vision triage, spatial clustering, dynamic SLA computation, workforce dispatch, "
        "and supervisory quality verification before issuing civic reward tokens.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # Master Workflow Phase Table
    wf_phases_data = [
        [Paragraph("<b>Phase &amp; Name</b>", table_header_style), Paragraph("<b>Primary Actor</b>", table_header_style), Paragraph("<b>Technical Process &amp; System Operations</b>", table_header_style), Paragraph("<b>SLA / Output State</b>", table_header_style)],
        [
            Paragraph("<b>Phase 1: Ingestion &amp; Pre-Flight</b>", table_cell_bold),
            Paragraph("Citizen / App", table_cell_style),
            Paragraph("Citizen captures live photo or selects file. Browser extracts EXIF metadata and GPS coordinates. HTML5 Geolocation API initiates reverse geocoding to resolve street address, zone, and ward ID.", table_cell_style),
            Paragraph("Status: <i>Pre-submission</i><br/>EXIF + GPS Pin resolved", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 2: AI Multi-Modal Inference</b>", table_cell_bold),
            Paragraph("AI Vision Engine", table_cell_style),
            Paragraph("Image streamed to YOLOv8 inference service. Performs bounding box localization, multi-class waste taxonomy classification (Plastics, Biomedical Sharps, E-Waste, Organic), volume estimation, and hazard index scoring.", table_cell_style),
            Paragraph("Confidence score (e.g. 94%)<br/>Hazard index calculated", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 3: Spatial Duplicate Clustering</b>", table_cell_bold),
            Paragraph("Geospatial Engine", table_cell_style),
            Paragraph("MongoDB <code>$geoNear</code> spatial query performs 50-meter radius search for unresolved complaints. Perceptual image hashing calculates visual similarity. If duplicate detected, report is linked into primary cluster.", table_cell_style),
            Paragraph("Duplicate linked or Single incident confirmed", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 4: SLA Binding &amp; Prioritization</b>", table_cell_bold),
            Paragraph("Priority Service", table_cell_style),
            Paragraph("Multi-factor formula calculates Composite Priority Score: <code>Score = 0.35(WasteType) + 0.25(Volume) + 0.20(Sensitivity) + 0.15(Recurrence) + 0.05(Time)</code>. Generates hard SLA due date (CRITICAL: 12h, MEDIUM: 24h, NORMAL: 48h).", table_cell_style),
            Paragraph("Status: <code>AI Analyzed</code><br/><code>dueAt</code> timestamp locked", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 5: Municipal Triage &amp; Dispatch</b>", table_cell_bold),
            Paragraph("Triage Officer", table_cell_style),
            Paragraph("Complaint appears in Municipal Priority Queue sorted by SLA urgency. Officer evaluates AI recommendations for workforce crew size, machinery (JCB / mini-dumper), and PPE kits, then assigns Sanitation Squad.", table_cell_style),
            Paragraph("Status: <code>Assigned</code><br/>Worker alerted via push", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 6: Field Worker Clearance</b>", table_cell_bold),
            Paragraph("Field Squad", table_cell_style),
            Paragraph("Squad receives work order on mobile device. Inspects hazard warning briefing, triggers turn-by-turn GPS navigation, marks status 'In Progress', performs physical clearance and segregation, and transports waste.", table_cell_style),
            Paragraph("Status: <code>In Progress</code><br/>Physical clearance executed", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 7: Geo-Tagged Proof Upload</b>", table_cell_bold),
            Paragraph("Squad Lead", table_cell_style),
            Paragraph("Squad captures live 'After' photo at the site. Camera module enforces live GPS validation and timestamping to prevent fraudulent gallery re-uploads. Logs disposal transfer station and volume cleared.", table_cell_style),
            Paragraph("Status: <code>Awaiting Verification</code><br/>Proof uploaded", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 8: Dual-Photo Verification &amp; QA</b>", table_cell_bold),
            Paragraph("Municipal Supervisor", table_cell_style),
            Paragraph("Supervisor inspects side-by-side Before/After comparison slider and AI cleanliness confidence score. One-click approval resolves the ticket; rejection returns ticket to field squad with required remediation notes.", table_cell_style),
            Paragraph("Status: <code>Resolved</code> or <code>Rejected</code><br/>Formal QA sign-off", table_cell_style)
        ],
        [
            Paragraph("<b>Phase 9: Citizen Closure &amp; Gamification</b>", table_cell_bold),
            Paragraph("Citizen / Platform", table_cell_style),
            Paragraph("Citizen receives real-time notification with resolution evidence. Citizen verifies clean site and submits 1-5 star rating. System credits Green Points to citizen account, updating eco-tier rank.", table_cell_style),
            Paragraph("Status: <code>Citizen Verified</code><br/>+50 Green Points issued", table_cell_style)
        ],
    ]
    wf_phases_table = Table(wf_phases_data, colWidths=[105, 75, 215, 90])
    wf_phases_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(wf_phases_table)
    story.append(Spacer(1, 8))

    # SLA Escalation Architecture Callout
    sla_desc = (
        "<b>Automated SLA Escalation Engine (Background Cron Service):</b> Running continuously via <code>node-cron</code> every 15 minutes, "
        "the escalation daemon queries all active complaints where <code>NOW > sla.dueAt</code> and status is not yet 'Resolved'. "
        "Overdue tickets are automatically promoted to <b>CRITICAL</b>, an immutable entry is logged in <code>priorityHistory</code>, "
        "and emergency WebSocket alert banners are pushed directly to Zonal Municipal Officers and the City Commissioner."
    )
    sla_table = Table([[Paragraph(sla_desc, callout_style)]], colWidths=[485])
    sla_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fffbeb")),
        ('BOX', (0,0), (-1,-1), 1, ACCENT_AMBER),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(sla_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 2: CITIZEN MODULE ACTIONS
    # =========================================================================
    story.append(Paragraph("2. Citizen Module: Detailed User Actions &amp; System Flows", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=6))
    
    story.append(Paragraph(
        "<b>Module Persona &amp; Scope:</b> Designed for everyday citizens, resident welfare associations, and community volunteers. "
        "Focuses on zero-friction waste reporting, real-time AI transparency, active complaint tracking, and civic gamification incentives. "
        "Primary Route Prefix: <code>/citizen/*</code>.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # Citizen Actions Table
    citizen_actions_data = [
        [Paragraph("<b>Action Code &amp; Name</b>", table_header_style), Paragraph("<b>User Interaction / Steps</b>", table_header_style), Paragraph("<b>System Processing &amp; AI Logic</b>", table_header_style), Paragraph("<b>Resulting State &amp; Output</b>", table_header_style)],
        [
            Paragraph("<b>ACT-C01: Live Camera / Photo Upload</b>", table_cell_bold),
            Paragraph("1. Taps 'Report Waste' button.<br/>2. Clicks camera icon to trigger device camera or selects existing photo from storage.", table_cell_style),
            Paragraph("Validates file type (JPEG/PNG/WebP, max 10MB). Strips malicious payloads, extracts EXIF orientation, generates local base64 thumbnail preview.", table_cell_style),
            Paragraph("Image preview rendered on screen; ready for AI scanning.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-C02: Geolocation &amp; Landmark Pin</b>", table_cell_bold),
            Paragraph("1. Device prompts for GPS permission.<br/>2. Citizen confirms detected pin or drags marker on interactive Leaflet map to adjust exact garbage dump spot.<br/>3. Enters nearby landmark.", table_cell_style),
            Paragraph("Browser HTML5 Geolocation queries hardware coordinates. Reverse geocoder translates lat/long into ward name (e.g. 'Ward 12 - Shivaji Nagar') and street address. MongoDB verifies ward boundary polygon.", table_cell_style),
            Paragraph("GeoJSON <code>[longitude, latitude]</code> stored; Ward ID auto-assigned.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-C03: Real-Time AI Pre-Analysis</b>", table_cell_bold),
            Paragraph("1. Observes automatic scanning animation over uploaded photo.<br/>2. Views detected waste categories, bounding boxes, and confidence score.", table_cell_style),
            Paragraph("Dispatches asynchronous request to YOLOv8 inference endpoint. Analyzes pixel features; classifies waste stream (Plastics, Hazardous Medical, E-Waste); estimates severity and volume.", table_cell_style),
            Paragraph("AI Confidence Badge (e.g. 94%), Segregation Stream, and Severity tag displayed.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-C04: Register &amp; Submit Complaint</b>", table_cell_bold),
            Paragraph("1. Verifies AI detected category (or selects override dropdown if needed).<br/>2. Adds optional textual notes.<br/>3. Toggles 'Report Anonymously' if desired.<br/>4. Clicks 'Submit Official Grievance'.", table_cell_style),
            Paragraph("Generates unique tracking code (<code>CT-2026-XXXXX</code>). Executes duplicate check query. Inserts document into MongoDB <code>complaints</code> collection with initial SLA timer.", table_cell_style),
            Paragraph("Status set to <code>AI Analyzed</code>. Success modal shown with Complaint ID and SLA countdown.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-C05: Track Active Grievances</b>", table_cell_bold),
            Paragraph("1. Navigates to 'My Complaints' tab.<br/>2. Filters complaints by status (All, In Progress, Resolved).<br/>3. Observes real-time progress bars.", table_cell_style),
            Paragraph("Retrieves user grievances sorted by submission timestamp. Computes remaining time until SLA breach: <code>remainingTime = dueAt - NOW</code>. Updates live via WebSocket listeners.", table_cell_style),
            Paragraph("Color-coded SLA countdown badge (Green = Safe, Red = Imminent Breach).", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-C06: Inspect Resolution Evidence</b>", table_cell_bold),
            Paragraph("1. Clicks on a resolved grievance ticket.<br/>2. Drags interactive Before/After comparison slider.<br/>3. Views clearance timestamp and squad notes.", table_cell_style),
            Paragraph("Fetches paired images: original <code>imageUrl</code> vs worker proof <code>workerEvidence.photoUrl</code>. Displays cleanup audit log and disposal transfer station details.", table_cell_style),
            Paragraph("Visual confirmation of restored site; enables citizen feedback.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-C07: Citizen Verification &amp; Rating</b>", table_cell_bold),
            Paragraph("1. Taps 'Confirm Cleanliness' button.<br/>2. Selects 1 to 5 star rating for field squad.<br/>3. Submits satisfaction remarks.", table_cell_style),
            Paragraph("Patches complaint status to <code>Citizen Verified</code>. Logs citizen satisfaction score. Dispatches trigger to Reward Engine to credit civic incentive tokens.", table_cell_style),
            Paragraph("+50 Green Points credited instantly; Thank You badge awarded.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-C08: Explore Ward Hotspots Map</b>", table_cell_bold),
            Paragraph("1. Opens 'Citizen Hotspots' view.<br/>2. Inspects ward-level cleanliness index heatmap.<br/>3. Clicks nearby community reports to upvote.", table_cell_style),
            Paragraph("Aggregates open complaint clusters within 2km radius. Renders density circles (Red = Heavy dumping, Green = Clean zone). Upvote increments priority weight.", table_cell_style),
            Paragraph("Community visibility of chronic dumping zones; prevents duplicate filings.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-C09: Redeem Green Points &amp; Perks</b>", table_cell_bold),
            Paragraph("1. Visits 'Green Points' ledger.<br/>2. Views current balance, eco-rank tier, and history.<br/>3. Selects reward voucher (e.g. 10% Municipal Tax rebate or Metro transit pass).", table_cell_style),
            Paragraph("Verifies available point balance. Deducts redeemed points from <code>users</code> ledger. Generates cryptographic QR discount coupon code.", table_cell_style),
            Paragraph("Redeemable QR code voucher generated; Tier status updated.", table_cell_style)
        ],
    ]
    citizen_table = Table(citizen_actions_data, colWidths=[105, 125, 145, 110])
    citizen_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(citizen_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 3: MUNICIPAL STAFF / TRIAGE OFFICER MODULE ACTIONS
    # =========================================================================
    story.append(Paragraph("3. Municipal Staff Module: Triage, Dispatch &amp; Quality Control", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=6))
    
    story.append(Paragraph(
        "<b>Module Persona &amp; Scope:</b> Built for Zonal Triage Officers, Municipal Sanitary Inspectors, and Ward Supervisors. "
        "Provides decision-support intelligence to triage incoming complaints, merge duplicate reports, deploy heavy machinery, "
        "dispatch field squads, and enforce strict quality verification. Primary Route Prefix: <code>/municipal/*</code>.",
        body_style
    ))
    story.append(Spacer(1, 4))

    municipal_actions_data = [
        [Paragraph("<b>Action Code &amp; Name</b>", table_header_style), Paragraph("<b>Officer Interaction &amp; Controls</b>", table_header_style), Paragraph("<b>System Processing &amp; Intelligence</b>", table_header_style), Paragraph("<b>Operational Impact</b>", table_header_style)],
        [
            Paragraph("<b>ACT-M01: Priority Queue Triage</b>", table_cell_bold),
            Paragraph("1. Opens 'Priority Queue'.<br/>2. Reviews incoming complaints dynamically sorted by SLA urgency and hazard severity.<br/>3. Filters by Ward or Waste Stream.", table_cell_style),
            Paragraph("Queries MongoDB complaints collection with compound index <code>{ 'priority.level': 1, 'sla.dueAt': 1 }</code>. Flags complaints under 3 hours to breach with pulsating red visual indicator.", table_cell_style),
            Paragraph("Immediate attention directed to high-risk hazards (biomedical/e-waste).", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M02: Spatial Duplicate Merging</b>", table_cell_bold),
            Paragraph("1. Navigates to 'Duplicate Detection' tab.<br/>2. Inspects grouped clusters of complaints.<br/>3. Reviews side-by-side images.<br/>4. Clicks 'Merge into Primary Ticket'.", table_cell_style),
            Paragraph("Algorithm clusters tickets located within 50m with perceptual image similarity > 80%. Merging updates duplicate tickets to <code>merged</code>, aggregates reporter list, and links all updates to parent ticket.", table_cell_style),
            Paragraph("Eliminates redundant truck dispatches to the same garbage spot.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M03: Recurring Waste Blackspot Audit</b>", table_cell_bold),
            Paragraph("1. Opens 'Recurring Waste' page.<br/>2. Reviews chronic blackspot frequency (>3 cleanups in 30 days).<br/>3. Inspects inferred root cause (e.g. missing street bin).", table_cell_style),
            Paragraph("Temporal aggregation queries historical cleanups per coordinate buffer. Calculates recurrence recurrence index. Recommends permanent intervention (CCTV installation or bin deployment).", table_cell_style),
            Paragraph("Shifts municipal strategy from reactive cleaning to root-cause prevention.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M04: GIS Hotspot &amp; Route Mapping</b>", table_cell_bold),
            Paragraph("1. Explores interactive GIS map.<br/>2. Toggles heatmap layers: Waste Volume, Biohazard Density, SLA Overdue zones.<br/>3. Views proximity to sensitive institutions.", table_cell_style),
            Paragraph("Renders Leaflet vector circles with graduated color ramps. Cross-references coordinates with sensitive municipal GIS layers (hospitals, primary schools, water reservoirs).", table_cell_style),
            Paragraph("Strategic spatial visibility of city-wide waste distribution.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M05: AI Recommendation Review</b>", table_cell_bold),
            Paragraph("1. Opens complaint detail.<br/>2. Reviews AI machinery suggestion.<br/>3. Evaluates suggested team size (e.g., 'Requires 4 workers + 1 Mini JCB Loader for construction debris').", table_cell_style),
            Paragraph("Heuristic AI engine cross-references estimated waste volume (m&sup3;) and material density. Recommends specialized PPE (heavy-duty puncture-proof gloves for medical sharps).", table_cell_style),
            Paragraph("Prevents worker injury and ensures right-sized equipment dispatch.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M06: Squad Dispatch &amp; Work Order</b>", table_cell_bold),
            Paragraph("1. Selects 'Assign Squad' dropdown.<br/>2. Chooses Sanitation Team (e.g. 'Squad 4 - Central Ward').<br/>3. Attaches officer instruction note.<br/>4. Clicks 'Confirm Dispatch'.", table_cell_style),
            Paragraph("Creates <code>Assignment</code> record. Updates complaint status to <code>Assigned</code>. Emits WebSocket event <code>TASK_ASSIGNED</code> to field squad tablet/mobile application.", table_cell_style),
            Paragraph("Work order transmitted instantly to field squad mobile device.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M07: Supervisory Cleanup Verification</b>", table_cell_bold),
            Paragraph("1. Opens 'Verification' queue.<br/>2. Reviews worker 'After' photo beside initial 'Before' photo.<br/>3. Checks AI Cleanliness Confidence Score.<br/>4. Clicks 'Approve Resolution'.", table_cell_style),
            Paragraph("System executes dual-image visual difference analysis. If cleanliness score &ge; 85%, green checkmark is displayed. Supervisor approval transitions status to <code>Resolved</code>.", table_cell_style),
            Paragraph("Verified clean; triggers citizen notification and Green Points.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M08: Rejection &amp; Remediation Re-Dispatch</b>", table_cell_bold),
            Paragraph("1. If 'After' photo reveals residual trash or incorrect spot, supervisor clicks 'Reject Proof'.<br/>2. Selects punch list reason (e.g. 'Residual debris left on sidewalk').", table_cell_style),
            Paragraph("Reverts status to <code>In Progress</code>. Appends supervisor feedback to task audit log. Sends high-priority correction push notification to field squad lead.", table_cell_style),
            Paragraph("Enforces 100% thorough cleanup standards before case closure.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M09: Spam &amp; Invalid Report Triage</b>", table_cell_bold),
            Paragraph("1. Reviews 'Invalid Reports' queue.<br/>2. Inspects AI-flagged false submissions (memes, selfies, non-waste images, duplicate spam).<br/>3. Confirms rejection.", table_cell_style),
            Paragraph("YOLOv8 confidence &lt; 25% or zero waste classes automatically flags complaint. Officer rejection marks ticket <code>Rejected</code> and flags user account for potential abuse penalties.", table_cell_style),
            Paragraph("Protects municipal workforce from chasing fake or frivolous reports.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M10: Municipal Analytics Inspection</b>", table_cell_bold),
            Paragraph("1. Visits 'Analytics' dashboard.<br/>2. Reviews ward turnaround times, SLA compliance %, total tonnage cleared, and waste composition breakdowns.", table_cell_style),
            Paragraph("Executes multi-stage MongoDB aggregation pipelines across complaints, assignments, and wards. Computes MTTR (Mean Time to Resolution).", table_cell_style),
            Paragraph("Actionable data for workforce reallocation and performance audits.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-M11: Export AI Intelligence Dossier</b>", table_cell_bold),
            Paragraph("1. Opens 'AI Reports' tab.<br/>2. Selects reporting period (Weekly / Monthly) and Ward.<br/>3. Clicks 'Generate Swachh Bharat Compliance PDF'.", table_cell_style),
            Paragraph("Assembles executive analytics, SLA compliance metrics, chronic blackspot audits, and equipment usage logs into publication-ready PDF.", table_cell_style),
            Paragraph("Automated official compliance dossier ready for City Commissioner.", table_cell_style)
        ],
    ]
    municipal_table = Table(municipal_actions_data, colWidths=[105, 125, 145, 110])
    municipal_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(municipal_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 4: FIELD WORKER / SANITATION SQUAD MODULE ACTIONS
    # =========================================================================
    story.append(Paragraph("4. Field Worker Module: Task Execution &amp; Evidence Capture", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=6))
    
    story.append(Paragraph(
        "<b>Module Persona &amp; Scope:</b> Engineered for Sanitation Squad Leaders, Waste Collection Drivers, and Field Crew. "
        "Designed with high-contrast, touch-first mobile interfaces for rough field conditions, clear hazard warnings, "
        "one-tap turn-by-turn navigation, and mandatory geo-tagged post-cleanup verification. Primary Route Prefix: <code>/worker/*</code>.",
        body_style
    ))
    story.append(Spacer(1, 4))

    worker_actions_data = [
        [Paragraph("<b>Action Code &amp; Name</b>", table_header_style), Paragraph("<b>Field Worker Interaction &amp; UI</b>", table_header_style), Paragraph("<b>Background System Actions</b>", table_header_style), Paragraph("<b>Operational Outcome</b>", table_header_style)],
        [
            Paragraph("<b>ACT-W01: Shift Login &amp; Task Roster</b>", table_cell_bold),
            Paragraph("1. Worker logs in on rugged mobile/tablet.<br/>2. Reviews assigned tasks for the shift ordered by proximity and SLA urgency.", table_cell_style),
            Paragraph("Filters active assignments where <code>assignedWorkerId == currentWorker</code> and status is not yet 'Resolved'. Highlights critical biohazard tasks.", table_cell_style),
            Paragraph("Clear operational roadmap for the shift; zero ambiguity.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-W02: Task Inspection &amp; Hazard Briefing</b>", table_cell_bold),
            Paragraph("1. Taps task card.<br/>2. Inspects initial waste photo, volume estimate, and prominent safety hazard alert (e.g. 'Caution: Medical Sharps Detected').", table_cell_style),
            Paragraph("Displays mandatory safety gear checklist (N95 mask, puncture-resistant gloves, puncture container) before enabling navigation.", table_cell_style),
            Paragraph("Ensures worker occupational safety compliance under CPCB norms.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-W03: Turn-by-Turn GPS Navigation</b>", table_cell_bold),
            Paragraph("1. Taps 'Navigate to Location' button.<br/>2. App launches embedded map route or redirects to Google Maps with exact target coordinates.", table_cell_style),
            Paragraph("Calculates real-time driving route from worker's current GPS position to waste coordinates. Displays landmark notes entered by reporting citizen.", table_cell_style),
            Paragraph("Rapid transit directly to garbage spot without searching.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-W04: Check-In &amp; Start Work</b>", table_cell_bold),
            Paragraph("1. Arrives at dumping location.<br/>2. Taps 'Start Cleanup Work' button.", table_cell_style),
            Paragraph("Verifies worker GPS coordinates are within 100m geofence of target. Updates complaint status to <code>In Progress</code>. Emits real-time update to citizen.", table_cell_style),
            Paragraph("Citizen sees 'Sanitation Squad has arrived and started cleaning'.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-W05: Physical Cleanup &amp; Segregation</b>", table_cell_bold),
            Paragraph("1. Squad clears waste into designated compartments (Dry recyclable, Wet compostable, Hazardous/Bio-waste).", table_cell_style),
            Paragraph("Operational protocol enforced: hazardous waste placed into yellow/red biohazard containment bins per CPCB standards.", table_cell_style),
            Paragraph("Physical restoration of civic site; source-segregated loading.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-W06: Live 'After' Photo Proof Capture</b>", table_cell_bold),
            Paragraph("1. Steps back to capture clear photo of restored, clean ground.<br/>2. Camera module stamps live GPS &amp; time.<br/>3. Inputs collected waste volume (e.g. '1.5 Tonnes').<br/>4. Taps 'Submit Completion'.", table_cell_style),
            Paragraph("Uploads evidence to server storage. Enforces live camera capture (blocks file picker to eliminate fraud). Updates status to <code>Awaiting Verification</code>.", table_cell_style),
            Paragraph("Proof submitted to supervisor verification queue; task completed in field.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-W07: Squad &amp; Equipment Coordination</b>", table_cell_bold),
            Paragraph("1. Opens 'Squad' tab.<br/>2. Views team member names, contact numbers, assigned compactor truck ID, and equipment manifest.", table_cell_style),
            Paragraph("Retrieves assigned squad roster and vehicle telematics link. Allows one-tap emergency calling to Zonal Sanitary Inspector.", table_cell_style),
            Paragraph("High cohesion across driver, crew members, and supervisor.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-W08: Performance &amp; Gratitude Ledger</b>", table_cell_bold),
            Paragraph("1. Opens 'History' tab.<br/>2. Reviews completed jobs, citizen feedback stars, and monthly productivity score.", table_cell_style),
            Paragraph("Queries historical resolved assignments. Aggregates citizen star ratings. Computes squad completion rate and bonus points.", table_cell_style),
            Paragraph("Worker morale and motivation driven by direct civic appreciation.", table_cell_style)
        ],
    ]
    worker_table = Table(worker_actions_data, colWidths=[105, 125, 145, 110])
    worker_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), ACCENT_BLUE),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(worker_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 5: ADMINISTRATOR & PUBLIC MODULE ACTIONS
    # =========================================================================
    story.append(Paragraph("5. Administrator &amp; Public Modules: Governance &amp; Transparency", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=6))
    
    story.append(Paragraph(
        "<b>Module Persona &amp; Scope:</b> Tailored for City Municipal Commissioners, Smart City Directors, IT Administrators, "
        "and Public Civic Observers. Enforces city-wide governance, cross-ward SLA benchmarking, AI model telemetry, and "
        "open data transparency. Primary Route Prefixes: <code>/admin/*</code> and <code>/*</code> (Public).",
        body_style
    ))
    story.append(Spacer(1, 4))

    admin_actions_data = [
        [Paragraph("<b>Action Code &amp; Name</b>", table_header_style), Paragraph("<b>Administrator / Public Flow</b>", table_header_style), Paragraph("<b>System Operation &amp; Telemetry</b>", table_header_style), Paragraph("<b>Governance Outcome</b>", table_header_style)],
        [
            Paragraph("<b>ACT-A01: City Cleanliness Command Center</b>", table_cell_bold),
            Paragraph("1. Administrator accesses executive dashboard.<br/>2. Reviews city-wide cleanliness index, total volume processed, active tickets, and breach rate.", table_cell_style),
            Paragraph("Real-time aggregation pipeline computes city-wide MTTR, SLA compliance percentage, and open crisis escalations across all 15 municipal wards.", table_cell_style),
            Paragraph("Bird's eye visibility for Municipal Commissioner.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-A02: Municipal Watch &amp; Benchmarking</b>", table_cell_bold),
            Paragraph("1. Opens 'Municipal Watch'.<br/>2. Ranks wards by resolution efficiency and breach rate.<br/>3. Inspects lagging wards.", table_cell_style),
            Paragraph("Computes composite Ward Efficiency Score based on on-time resolution, recurring dump frequency, and citizen satisfaction ratings.", table_cell_style),
            Paragraph("Identifies under-resourced wards needing additional trucks/squads.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-A03: User RBAC &amp; Ward Allocation</b>", table_cell_bold),
            Paragraph("1. Opens 'User Management'.<br/>2. Creates/edits user accounts.<br/>3. Assigns roles (Citizen, Staff, Worker, Admin) and ward jurisdictions.<br/>4. Toggles account activation.", table_cell_style),
            Paragraph("Encrypts passwords via bcrypt (10 rounds). Signs JWT tokens with role claims. Enforces strict backend route middleware (<code>authorizeRoles</code>).", table_cell_style),
            Paragraph("Total security and access governance across municipal staff.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-A04: AI Vision Engine Health &amp; Telemetry</b>", table_cell_bold),
            Paragraph("1. Visits 'AI Monitoring' console.<br/>2. Inspects model inference latency, confidence distribution histograms, and false positive rates.", table_cell_style),
            Paragraph("Logs latency per inference (average 142ms). Tracks low-confidence edge cases for dataset curation and retraining loop.", table_cell_style),
            Paragraph("Ensures deep learning models operate within production tolerances.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-A05: SLA &amp; System Configuration</b>", table_cell_bold),
            Paragraph("1. Opens System Settings.<br/>2. Adjusts SLA hours per priority (Normal: 48h &rarr; 36h).<br/>3. Modifies Green Points multiplier.", table_cell_style),
            Paragraph("Updates <code>SystemSetting</code> document. Escalation cron engine and priority calculator dynamically adopt updated parameters without server restart.", table_cell_style),
            Paragraph("Agile policy adjustments during city clean drives and festivals.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-A06: Immutable Security Audit Inspection</b>", table_cell_bold),
            Paragraph("1. Opens Audit Log viewer.<br/>2. Filters audit logs by user, date range, or action type (e.g. 'MANUAL_PRIORITY_OVERRIDE').", table_cell_style),
            Paragraph("Queries immutable <code>AuditLog</code> collection recording user ID, IP address, timestamp, previous state, and modified state.", table_cell_style),
            Paragraph("Tamper-proof compliance trail for anti-corruption oversight.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-P01: Public Cleanliness Transparency</b>", table_cell_bold),
            Paragraph("1. Any unauthenticated citizen visits public portal.<br/>2. Views live statistics: Tons of waste cleared, active civic campaigns, top wards.", table_cell_style),
            Paragraph("Caches public metric endpoints in Redis/memory to prevent database load. Renders interactive impact counters and environmental metrics.", table_cell_style),
            Paragraph("Builds public trust through radical municipal transparency.", table_cell_style)
        ],
        [
            Paragraph("<b>ACT-P02: Interactive AI Intelligence Demo</b>", table_cell_bold),
            Paragraph("1. Public visitor opens 'AI Intelligence' page.<br/>2. Toggles sample waste images (PET bottles, syringe sharps, circuit boards) to inspect AI bounding boxes.", table_cell_style),
            Paragraph("Demonstrates real-time browser inference and multi-class segmentation. Educates citizens on proper waste segregation at source.", table_cell_style),
            Paragraph("Promotes community environmental awareness and literacy.", table_cell_style)
        ],
    ]
    admin_table = Table(admin_actions_data, colWidths=[105, 125, 145, 110])
    admin_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(admin_table)
    story.append(PageBreak())

    # =========================================================================
    # SECTION 6: CROSS-MODULE STATE LIFECYCLE & TECHNICAL SPECIFICATIONS
    # =========================================================================
    story.append(Paragraph("6. Cross-Module State Machine &amp; Technical Specifications", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=PRIMARY, spaceBefore=2, spaceAfter=6))
    
    story.append(Paragraph(
        "<b>State Transition Protocol:</b> Every complaint entity in CleanTrack transitions through strict, deterministic states. "
        "State transitions can only be triggered by authorized actors or verified system daemons, ensuring total integrity.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # State Machine Table
    state_machine_data = [
        [Paragraph("<b>Status State</b>", table_header_style), Paragraph("<b>Trigger Event &amp; Initiator</b>", table_header_style), Paragraph("<b>Prerequisites &amp; Validation</b>", table_header_style), Paragraph("<b>Automated Notifications &amp; Actions</b>", table_header_style)],
        [
            Paragraph("<code>Reported</code>", table_cell_bold),
            Paragraph("Citizen submits form via Web/Mobile.", table_cell_style),
            Paragraph("Valid image uploaded; coordinates within city boundaries.", table_cell_style),
            Paragraph("Complaint ID assigned; image queued for AI inference.", table_cell_style)
        ],
        [
            Paragraph("<code>AI Analyzed</code>", table_cell_bold),
            Paragraph("AI Vision Service completes inference.", table_cell_style),
            Paragraph("Bounding boxes extracted; confidence &ge; 25%.", table_cell_style),
            Paragraph("Priority score computed; <code>dueAt</code> SLA locked; added to queue.", table_cell_style)
        ],
        [
            Paragraph("<code>Under Review</code>", table_cell_bold),
            Paragraph("Municipal Officer opens ticket details.", table_cell_style),
            Paragraph("Officer possesses valid RBAC role <code>municipal_staff</code>.", table_cell_style),
            Paragraph("Locks ticket for 10 minutes to prevent duplicate assignment.", table_cell_style)
        ],
        [
            Paragraph("<code>Assigned</code>", table_cell_bold),
            Paragraph("Officer selects Sanitation Squad.", table_cell_style),
            Paragraph("Target squad exists and has active shift status.", table_cell_style),
            Paragraph("WebSocket push to worker mobile; citizen notified of squad name.", table_cell_style)
        ],
        [
            Paragraph("<code>In Progress</code>", table_cell_bold),
            Paragraph("Worker taps 'Start Work' on site.", table_cell_style),
            Paragraph("Worker GPS within 100m geofence of complaint coordinates.", table_cell_style),
            Paragraph("Citizen receives live notification: 'Squad is cleaning your area'.", table_cell_style)
        ],
        [
            Paragraph("<code>Awaiting Verification</code>", table_cell_bold),
            Paragraph("Worker submits live 'After' photo.", table_cell_style),
            Paragraph("Photo metadata verified live (camera capture timestamp &lt; 5 min).", table_cell_style),
            Paragraph("Ticket routed to Supervisor Verification Queue; dual-slider loaded.", table_cell_style)
        ],
        [
            Paragraph("<code>Resolved</code>", table_cell_bold),
            Paragraph("Supervisor approves resolution.", table_cell_style),
            Paragraph("After photo verified clean; AI difference score &ge; 85%.", table_cell_style),
            Paragraph("AuditLog stamped; citizen prompted for feedback; SLA timer stopped.", table_cell_style)
        ],
        [
            Paragraph("<code>Citizen Verified</code>", table_cell_bold),
            Paragraph("Citizen confirms clean &amp; rates squad.", table_cell_style),
            Paragraph("Rating between 1 and 5 stars submitted.", table_cell_style),
            Paragraph("+50 Green Points credited to citizen; squad rating updated.", table_cell_style)
        ],
        [
            Paragraph("<code>Rejected</code>", table_cell_bold),
            Paragraph("Officer rejects spam / non-waste.", table_cell_style),
            Paragraph("Formal rejection code selected (e.g. 'Invalid Image / Spam').", table_cell_style),
            Paragraph("Citizen notified with formal reason; SLA cancelled; no points awarded.", table_cell_style)
        ],
    ]
    state_table = Table(state_machine_data, colWidths=[90, 115, 135, 145])
    state_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), PRIMARY_DARK),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, BG_LIGHT]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(state_table)
    story.append(Spacer(1, 8))

    # Core Engineering Equations Callout
    math_box_text = (
        "<b>Mathematical Models &amp; Algorithmic Formulations:</b><br/>"
        "&bull; <b>Composite Severity Formula:</b> <code>Priority_Score = &omega;1*S_waste + &omega;2*S_vol + &omega;3*S_loc + &omega;4*S_recur + &omega;5*S_time</code>, "
        "where weights &omega; = [0.35, 0.25, 0.20, 0.15, 0.05]. Biomedical waste sets <code>S_waste = 100</code>.<br/>"
        "&bull; <b>Dynamic SLA Deadline Generation:</b> <code>dueAt = createdAt + SLA_Window(Priority_Level)</code>, "
        "where CRITICAL = 12 Hours, MEDIUM = 24 Hours, NORMAL = 48 Hours.<br/>"
        "&bull; <b>Haversine Proximity Clustering:</b> <code>d = 2R &middot; arcsin(&radic;(sin&sup2;(&Delta;&phi;/2) + cos(&phi;1)cos(&phi;2)sin&sup2;(&Delta;&lambda;/2))) &le; 50m</code>."
    )
    math_table = Table([[Paragraph(math_box_text, callout_green)]], colWidths=[485])
    math_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, ACCENT_GREEN),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(math_table)
    story.append(Spacer(1, 10))

    # Concluding Technical Assurance Block
    story.append(Paragraph("<b>Technical Assurance &amp; Deployment Readiness</b>", h2_style))
    story.append(Paragraph(
        "CleanTrack has been verified under comprehensive end-to-end integration testing across 12 API controllers, "
        "10 MongoDB domain schemas, 4 distinct user persona dashboards, and real-time Socket.io bi-directional event pipelines. "
        "The architecture adheres strictly to CPCB waste management compliance, Swachh Bharat Mission 2.0 digital governance protocols, "
        "and production-grade microservice security standards.",
        body_style
    ))
    story.append(Spacer(1, 12))

    signoff_data = [
        [Paragraph("<b>Report Generated:</b> September 2026", cover_meta_style), Paragraph("<b>SIH Project Domain:</b> Smart Cleanliness &amp; Waste Governance", cover_meta_style), Paragraph("<b>Build Status:</b> Production Ready (v2.4.0)", cover_meta_style)]
    ]
    signoff_table = Table(signoff_data, colWidths=[160, 205, 120])
    signoff_table.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(signoff_table)

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built: {filename}")

if __name__ == "__main__":
    output_filename = "CleanTrack_Workflow_and_Module_Actions_Report.pdf"
    if len(sys.argv) > 1:
        output_filename = sys.argv[1]
    build_pdf(output_filename)
