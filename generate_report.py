from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as cv
import os

W, H = A4
PHOTOS = "/home/claude/photos"
OUT    = "/mnt/user-data/outputs/Themis_Report_v2.pdf"

WHITE    = colors.white
DARK     = colors.HexColor("#0f172a")
NAVY     = colors.HexColor("#1e3a5f")
GREEN    = colors.HexColor("#059669")
GREEN_LT = colors.HexColor("#dcfce7")
BLUE     = colors.HexColor("#0284c7")
BLUE_LT  = colors.HexColor("#dbeafe")
AMBER    = colors.HexColor("#d97706")
AMBER_LT = colors.HexColor("#fef3c7")
RED      = colors.HexColor("#dc2626")
RED_LT   = colors.HexColor("#fee2e2")
PURPLE   = colors.HexColor("#7c3aed")
PURPLE_LT= colors.HexColor("#f3e8ff")
GREY     = colors.HexColor("#64748b")
GREY_LT  = colors.HexColor("#f8fafc")
GREY_MID = colors.HexColor("#e2e8f0")
GREY_DK  = colors.HexColor("#334155")
ORANGE   = colors.HexColor("#ea580c")
ORANGE_LT= colors.HexColor("#fff7ed")

LM = 18*mm
RM = W - 18*mm
CW = RM - LM

FINDINGS = [
    ("C2","AC isolator not correctly installed - minimum IP2x not achieved","BS 7671 reg 416.2.1","Immediately remediate AC isolator installation to meet IP2x rating"),
    ("C3","No smoke detector at inverter location in loft","BS 5839-6 Clause 11.1.1","Install suitable smoke detection at inverter location"),
    ("C3","Inverter does not have correct recommended clearances","BS 7671 reg 134.1.1 / SMA SB1200 datasheet","Reposition - minimum 400mm top, 200mm side clearances required"),
    ("C3","Type AC RCD installed - Type A minimum required for solar PV","BS 7671 531.3.3","Replace Type AC RCD with Type A bidirectional device"),
    ("C3","No dual supply warning labels at point of interconnection","BS 7671 712.514","Fit dual supply warning labels at all interconnection points"),
    ("C3","No single line wiring diagram displayed on site","IET Code of Practice 9.7b","Produce and display wiring diagram at inverter location"),
    ("C3","No surge protection device (SPD) present","BS 7671 443","Assess risk and consider Type 2 SPD installation"),
    ("C3","Emergency shutdown procedure not displayed on site","IET Code of Practice","Display emergency shutdown procedure at inverter and supply"),
    ("FI","Inverter mounted on combustible material - appears to be wood","SMA SB1200 manufacturers instructions","Verify mounting surface - if combustible, install on non-combustible board"),
    ("FI","Array frame equipotential bonding not confirmed installed","IEC 60364-7-712","Investigate requirement and install if required for functional earth"),
]

CHECKLIST = [
    ("Solar Panels",[
        ("Orientation of solar panels","--","South",""),
        ("Number of solar panels","--","4",""),
        ("Location of solar panels","--","Front elevation",""),
        ("Are the panels damaged?","No","No damage observed",""),
        ("Panels clean / clear of debris?","Yes","Clear - moss on nearby roof tiles",""),
        ("Can the panel make be identified?","Lim","Could not identify from ground",""),
        ("PV array cables appear secure?","Lim","Not fully visible",""),
        ("Array frame equipotential bonding?","Lim","No evidence of bonding","FI"),
        ("Evidence of bird / pest damage?","No","",""),
        ("Junction boxes secure and undamaged?","Yes","",""),
    ]),
    ("Inverter",[
        ("Make","--","SMA",""),
        ("Model","--","Sunny Boy SB1200",""),
        ("Serial number","--","2001652401",""),
        ("Location","--","Loft",""),
        ("Smoke detector at inverter location?","No","No smoke detection in loft","C3"),
        ("Inverter functioning correctly?","Yes","Green LED - MPP mode",""),
        ("Inverter clear of debris?","Yes","",""),
        ("Correct recommended clearances?","No","Does not meet 400mm top clearance","C3"),
        ("Installed on non-combustible material?","FI","Appears to be mounted on wood","FI"),
        ("Securely mounted?","Yes","Free from vibration",""),
        ("LED indicators functioning?","Yes","",""),
    ]),
    ("Isolation",[
        ("DC switch disconnector fitted?","Yes","DC disconnector installed",""),
        ("DC isolator correctly labelled?","Yes","",""),
        ("DC isolator in good working condition?","Yes","",""),
        ("AC switch disconnector installed?","Yes","AC isolator located",""),
        ("AC isolator correctly labelled?","Yes","PV System Main AC Isolator",""),
        ("AC isolator in good working condition?","Yes","",""),
        ("AC isolator meets minimum IP2x?","No","IP2x not achieved - cover missing","C2"),
        ("AC isolator local to distribution?","Yes","",""),
    ]),
    ("AC Supply",[
        ("Installation protected by RCD?","Yes","VR80 80A 30mA installed",""),
        ("RCD BS number","--","61008",""),
        ("RCD type","--","Type AC",""),
        ("RCD bidirectional rated?","No","Type AC - Type A required","C3"),
        ("Surge protection (SPD) present?","No","No SPD installed","C3"),
        ("Array framework equipotential bonded?","Lim","Unable to fully verify","FI"),
    ]),
    ("Labelling",[
        ("All circuits suitably labelled?","Yes","",""),
        ("Main AC isolator clearly labelled?","Yes","PV System Main AC Isolator",""),
        ("Dual supply warning labels fitted?","No","No dual supply labels present","C3"),
        ("Single line wiring diagram on site?","No","No wiring diagram present","C3"),
        ("Emergency shutdown procedure?","No","Not displayed","C3"),
        ("DC junction box warning labels?","Yes","",""),
    ]),
    ("Generation Meter",[
        ("Make","--","Landis + Gyr",""),
        ("Model","--","5235B",""),
        ("Serial number","--","A471077465",""),
        ("Current meter reading","--","005065.1 kWh",""),
        ("Meter accessible and readable?","Yes","",""),
        ("Meter correctly labelled?","Yes","",""),
    ]),
    ("General / Mechanical",[
        ("Ventilation behind array?","Yes","",""),
        ("Array frame corrosion proof?","Yes","",""),
        ("Array frame correctly fixed?","Yes","",""),
        ("Cable entry weatherproof?","Lim","Cable outlet to tile inaccessible",""),
    ]),
]

TEST_RESULTS = [
    ("Voc (Open Circuit Voltage)","113 V","120 V rated",True),
    ("Isc (Short Circuit Current)","7.45 A","10 A rated",True),
    ("Irradiance","249.1 W/m2","--",None),
    ("IR Pos-Earth",">200 MOhm",">=1 MOhm",True),
    ("IR Neg-Earth",">200 MOhm",">=1 MOhm",True),
    ("Polarity Check","Satisfactory","Satisfactory",True),
    ("Zs","0.60 Ohm","--",None),
    ("RCD Type","Type AC","Type A minimum",False),
    ("RCD Trip Time","29 ms","<=300 ms",True),
    ("MCB Rating","16 A","--",None),
    ("Breaking Capacity","6 kA","--",None),
    ("Switchgear","Satisfactory","Satisfactory",True),
    ("Inverter Function","Satisfactory","Satisfactory",True),
    ("Loss of Mains","Satisfactory","Satisfactory",True),
]

COMP_LIFE = [
    ("Inverter",         10, 12, "2-5 years"),
    ("Solar Panels",     10, 28, "15-20 years"),
    ("DC Isolator",      10, 18, "5-8 years"),
    ("AC Isolator",      10, 18, "5-8 years"),
    ("RCD / Protection", 10, 15, "2-5 years"),
    ("DC Wiring",        10, 25, "10-15 years"),
    ("Mounting System",  10, 25, "10-15 years"),
    ("Generation Meter", 10, 20, "8-10 years"),
]

def get_cond(age, expected):
    pct = age / expected
    if pct < 0.4:  return 1, GREEN,   GREEN_LT,   "Excellent"
    if pct < 0.6:  return 2, BLUE,    BLUE_LT,    "Good"
    if pct < 0.8:  return 3, AMBER,   AMBER_LT,   "Monitor"
    if pct < 1.0:  return 4, ORANGE,  ORANGE_LT,  "Attention"
    return              5, RED,    RED_LT,     "End of Life"

def build():
    c = cv.Canvas(OUT, pagesize=A4)
    pn = [0]

    def np(cover=False):
        if pn[0]>0: c.showPage()
        pn[0]+=1
        c.setFillColor(WHITE)
        c.rect(0,0,W,H,fill=1,stroke=0)
        if cover:
            c.setFillColor(DARK)
            c.rect(0,H*0.58,W,H*0.42,fill=1,stroke=0)
            c.setFillColor(GREEN)
            c.rect(0,H-4,W,4,fill=1,stroke=0)
            c.rect(0,0,4,H,fill=1,stroke=0)
        else:
            c.setFillColor(DARK)
            c.rect(0,H-22,W,22,fill=1,stroke=0)
            c.setFillColor(GREEN)
            c.rect(0,H-2,W,2,fill=1,stroke=0)
            c.setFont("Helvetica-Bold",7.5)
            c.setFillColor(GREEN)
            c.drawString(LM,H-15,"THEMIS")
            c.setFont("Helvetica",7)
            c.setFillColor(colors.HexColor("#94a3b8"))
            c.drawRightString(RM,H-15,"Solar PV Inspection  |  Bolton at Home  |  TH-2024-002")
            c.setFillColor(GREY_LT)
            c.rect(0,0,W,13,fill=1,stroke=0)
            c.setStrokeColor(GREY_MID)
            c.setLineWidth(0.5)
            c.line(0,13,W,13)
            c.setFont("Helvetica",6.5)
            c.setFillColor(GREY)
            c.drawString(LM,4,"Certificate No: TH-2024-0002  |  01 August 2024  |  Themis Diagnostics Platform")
            c.drawRightString(RM,4,f"Page {pn[0]}")

    def t(x,y,s,f="Helvetica",sz=9,col=None,a="left"):
        c.setFillColor(col or DARK)
        c.setFont(f,sz)
        s=str(s) if s else ""
        if a=="right": c.drawRightString(x,y,s)
        elif a=="center": c.drawCentredString(x,y,s)
        else: c.drawString(x,y,s)

    def fl(x,y,w,h,col):
        c.setFillColor(col)
        c.rect(x,y,w,h,fill=1,stroke=0)

    def bx(x,y,w,h,fc,sc,lw=0.5):
        c.setFillColor(fc)
        c.setStrokeColor(sc)
        c.setLineWidth(lw)
        c.rect(x,y,w,h,fill=1,stroke=1)

    def hl(y,col=None,lw=0.5):
        c.setStrokeColor(col or GREY_MID)
        c.setLineWidth(lw)
        c.line(LM,y,RM,y)

    def sec(y,num,title):
        fl(LM,y-8*mm,22*mm,8*mm,NAVY)
        t(LM+11*mm,y-5.5*mm,f"SECTION {num}","Helvetica-Bold",6.5,WHITE,"center")
        t(LM+25*mm,y-5.5*mm,title,"Helvetica-Bold",16,DARK)
        y-=9*mm
        fl(LM,y,48*mm,2,GREEN)
        return y-8*mm

    def kv(x,y,w,key,val,alt=False,vc=None):
        fl(x,y-10*mm,w,10*mm,GREY_LT if alt else WHITE)
        c.setStrokeColor(GREY_MID)
        c.setLineWidth(0.3)
        c.line(x,y-10*mm,x+w,y-10*mm)
        t(x+4*mm,y-7*mm,key,"Helvetica",9,GREY)
        t(x+w-4*mm,y-7*mm,str(val) if val else "--","Helvetica-Bold",9.5,vc or DARK,"right")
        return y-10*mm

    def abadge(x,y,ans):
        col=GREEN if ans=="Yes" else RED if ans=="No" else AMBER if ans=="Lim" else PURPLE if ans=="FI" else GREY
        lt=GREEN_LT if ans=="Yes" else RED_LT if ans=="No" else AMBER_LT if ans=="Lim" else PURPLE_LT if ans=="FI" else GREY_LT
        bx(x,y,14*mm,6*mm,lt,col,0.5)
        t(x+7*mm,y+1.8*mm,ans,"Helvetica-Bold",7.5,col,"center")

    def cbadge(x,y,code):
        col=RED if code=="C2" else AMBER if code=="C3" else PURPLE
        lt=RED_LT if code=="C2" else AMBER_LT if code=="C3" else PURPLE_LT
        bx(x,y,11*mm,6*mm,lt,col,0.6)
        t(x+5.5*mm,y+1.8*mm,code,"Helvetica-Bold",7.5,col,"center")

    def pbadge(x,y,res):
        if res is True:
            bx(x,y,16*mm,6*mm,GREEN_LT,GREEN,0.5)
            t(x+8*mm,y+1.8*mm,"PASS","Helvetica-Bold",7.5,GREEN,"center")
        elif res is False:
            bx(x,y,16*mm,6*mm,RED_LT,RED,0.5)
            t(x+8*mm,y+1.8*mm,"FAIL","Helvetica-Bold",7.5,RED,"center")
        else:
            bx(x,y,16*mm,6*mm,GREY_LT,GREY_MID,0.5)
            t(x+8*mm,y+1.8*mm,"INFO","Helvetica-Bold",7.5,GREY,"center")

    def photo(path,x,y,w,h,cap=""):
        if os.path.exists(path):
            try: c.drawImage(path,x,y,w,h,preserveAspectRatio=True,anchor='c')
            except:
                fl(x,y,w,h,GREY_LT)
                t(x+w/2,y+h/2,"Photo unavailable","Helvetica",8,GREY,"center")
        else:
            fl(x,y,w,h,GREY_LT)
            c.setStrokeColor(GREY_MID)
            c.setLineWidth(0.5)
            c.rect(x,y,w,h,fill=0,stroke=1)
            t(x+w/2,y+h/2,"Photo not available","Helvetica",8,GREY,"center")
        if cap:
            fl(x,y-6*mm,w,6*mm,GREY_LT)
            c.setStrokeColor(GREY_MID)
            c.setLineWidth(0.3)
            c.rect(x,y-6*mm,w,6*mm,fill=0,stroke=1)
            cs=cap[:65]+"..." if len(cap)>65 else cap
            t(x+w/2,y-4.2*mm,cs,"Helvetica",6.5,GREY,"center")

    # PAGE 1: COVER
    np(cover=True)
    y=H-18*mm
    t(LM+6*mm,y,"THEMIS","Helvetica-Bold",34,GREEN)
    t(LM+6*mm,y-12*mm,"DIAGNOSTICS","Helvetica",10,colors.HexColor("#94a3b8"))
    y-=22*mm
    t(LM+6*mm,y,"SOLAR PV INSPECTION REPORT","Helvetica-Bold",9,colors.HexColor("#94a3b8"))
    y-=9*mm
    t(LM+6*mm,y,"Bolton at Home","Helvetica-Bold",28,WHITE)
    y-=11*mm
    t(LM+6*mm,y,"1 Back Alice Street, Little Lever, Bolton, BL3 1FX","Helvetica",10,colors.HexColor("#94a3b8"))
    y-=16*mm
    bw=(CW-9*mm)/4
    for i,(lbl,val) in enumerate([("JOB NUMBER","TH-2024-002"),("DATE","01 Aug 2024"),("ENGINEER","L. McKenna"),("CERT NO.","TH-2024-0002")]):
        bxx=LM+i*(bw+3*mm)
        fl(bxx,y-16*mm,bw,16*mm,colors.HexColor("#1e3a5f"))
        c.setStrokeColor(colors.HexColor("#2a4a6f"))
        c.setLineWidth(0.5)
        c.rect(bxx,y-16*mm,bw,16*mm,fill=0,stroke=1)
        t(bxx+3*mm,y-7*mm,lbl,"Helvetica-Bold",6,colors.HexColor("#64748b"))
        t(bxx+3*mm,y-13*mm,val,"Helvetica-Bold",9.5,WHITE)
    y-=22*mm
    sy=y-30*mm
    bx(LM,sy,58*mm,30*mm,AMBER_LT,AMBER,1.2)
    t(LM+29*mm,sy+22*mm,"OVERALL STATUS","Helvetica-Bold",7,AMBER,"center")
    t(LM+29*mm,sy+12*mm,"ADVISORY","Helvetica-Bold",20,AMBER,"center")
    gap=3*mm
    sw=(CW-58*mm-gap*3)/3
    for i,(code,cnt,col,lt) in enumerate([("C2","1",RED,RED_LT),("C3","7",AMBER,AMBER_LT),("FI","2",PURPLE,PURPLE_LT)]):
        bxx=LM+58*mm+gap+i*(sw+gap)
        bx(bxx,sy,sw,30*mm,lt,col,0.8)
        t(bxx+sw/2,sy+21*mm,cnt,"Helvetica-Bold",24,col,"center")
        t(bxx+sw/2,sy+12*mm,code,"Helvetica-Bold",9,col,"center")
        t(bxx+sw/2,sy+4*mm,["","Potentially Dangerous","Advisory","Investigate"][["C2","C3","FI"].index(code)+1],"Helvetica",5.5,col,"center")
    y=sy-8*mm
    ph=56*mm
    c.setStrokeColor(GREY_MID)
    c.setLineWidth(0.5)
    c.rect(LM,y-ph,CW,ph,fill=0,stroke=1)
    photo(f"{PHOTOS}/00_front_elevation.jpg",LM,y-ph,CW,ph,
          "Front elevation - 1 Back Alice Street, Little Lever, Bolton - 01/08/2024 11:22")

    # PAGE 2: EXECUTIVE SUMMARY
    np()
    y=H-32*mm
    y=sec(y,"1","Executive Summary")
    fl(LM,y-52*mm,CW,52*mm,BLUE_LT)
    c.setStrokeColor(BLUE)
    c.setLineWidth(1)
    c.rect(LM,y-52*mm,CW,52*mm,fill=0,stroke=1)
    fl(LM,y-52*mm,4*mm,52*mm,BLUE)
    sl=["Solar PV inspection completed for Bolton at Home at 1 Back Alice Street,",
        "Little Lever, Bolton. The installation is approximately 10 years old and in",
        "a reasonably kept condition. One potentially dangerous condition (C2) was",
        "identified relating to the AC isolator installation requiring immediate action.",
        "Seven C3 advisory items and two FI items identified. Test results satisfactory",
        "with Voc, Isc and insulation resistance within acceptable limits at 249.1 W/m2.",
        "A conditionality assessment has been completed - the inverter and RCD are",
        "approaching end of expected service life and should be budgeted for replacement."]
    sy2=y-8*mm
    for sl2 in sl:
        t(LM+7*mm,sy2,sl2,"Helvetica",10,GREY_DK)
        sy2-=6*mm
    y-=56*mm
    t(LM,y,"RECOMMENDED ACTIONS","Helvetica-Bold",10,DARK)
    y-=6*mm
    hl(y)
    y-=4*mm
    for i,(pre,act,col) in enumerate([
        ("URGENT","Remediate C2 AC isolator before continued use of installation",RED),
        ("Action","Schedule remedial works for 7 C3 advisory items",DARK),
        ("Action","Arrange further investigation for 2 FI items without delay",DARK),
        ("Action","Budget for inverter and RCD replacement within 3-5 years",DARK),
        ("Note","Retain this report and make available for next inspection",GREY),
    ]):
        fl(LM,y-10*mm,CW,10*mm,GREY_LT if i%2==0 else WHITE)
        c.setStrokeColor(GREY_MID)
        c.setLineWidth(0.2)
        c.line(LM,y-10*mm,RM,y-10*mm)
        if pre=="URGENT": fl(LM,y-10*mm,3*mm,10*mm,RED)
        t(LM+6*mm,y-7*mm,pre+":","Helvetica-Bold",9,RED if pre=="URGENT" else BLUE)
        t(LM+26*mm,y-7*mm,act,"Helvetica",9.5,col)
        y-=10*mm
    y-=8*mm
    hw=(CW-4*mm)/2
    for bxx,lbl,val,col,lt in [(LM,"NEXT INSPECTION","12 months",GREEN,GREEN_LT),(LM+hw+4*mm,"MISSING RECORDS","7 items",AMBER,AMBER_LT)]:
        bx(bxx,y-24*mm,hw,24*mm,lt,col,0.7)
        t(bxx+hw/2,y-9*mm,lbl,"Helvetica-Bold",8,col,"center")
        t(bxx+hw/2,y-18*mm,val,"Helvetica-Bold",17,col,"center")

    # PAGE 3: ASSET REGISTER
    np()
    y=H-32*mm
    y=sec(y,"2","Asset Register")
    for stitle,scol,rows in [
        ("SOLAR PANELS",BLUE,[("Panel Count","4"),("Panel Make","Sanyo"),("Panel Model","HIT-200BA3"),("System Age","10 years")]),
        ("INVERTER",GREEN,[("Make","SMA"),("Model","Sunny Boy SB1200"),("Serial Number","2001652401"),("Location","Loft"),("DC Isolator Location","Adjacent to inverter - loft"),("AC Isolator Location","Electrical intake area")]),
        ("GENERATION METER",PURPLE,[("Make","Landis + Gyr"),("Model","5235B"),("Serial Number","A471077465"),("Reading at Inspection","005065.1 kWh")]),
    ]:
        fl(LM,y-10*mm,CW,10*mm,NAVY)
        fl(LM,y-10*mm,4*mm,10*mm,scol)
        t(LM+8*mm,y-7*mm,stitle,"Helvetica-Bold",9,WHITE)
        y-=10*mm
        for ri,(k,v) in enumerate(rows):
            y=kv(LM,y,CW,k,v,alt=ri%2==0,vc=GREEN if "Serial" in k else DARK)
        y-=6*mm

    # PAGE 4: MANUFACTURER SPECS
    np()
    y=H-32*mm
    y=sec(y,"3","Manufacturer Specifications")
    t(LM,y,"SMA Sunny Boy SB1200 - Inverter Technical Datasheet","Helvetica-Bold",10,DARK)
    y-=7*mm
    specs=[("Rated Output Power","1,200 W",False),("Max DC Input Voltage","200 V",False),("Rated Voc (String)","120 V",False),("Rated Isc","10 A",False),("MPPT Voltage Range","15-120 V",False),("AC Output Voltage","230 V",False),("Efficiency","93%",False),("IP Rating","IP54",False),("Min Clearance - Top","400 mm",True),("Min Clearance - Sides","200 mm",True),("Mounting Surface","Non-combustible ONLY",True),("Operating Temp","-25 to +60 degC",False),("Protection Class","Class I",False),("Weight","14 kg",False)]
    half=(CW-4*mm)/2
    sy3=y
    for ri,(k,v,warn) in enumerate(specs[:7]):
        y=kv(LM,y,half,k,v,alt=ri%2==0,vc=AMBER if warn else DARK)
    y2=sy3
    for ri,(k,v,warn) in enumerate(specs[7:]):
        y2=kv(LM+half+4*mm,y2,half,k,v,alt=ri%2==0,vc=AMBER if warn else DARK)
    y=min(y,y2)-10*mm
    wh=28*mm
    fl(LM,y-wh,CW,wh,AMBER_LT)
    c.setStrokeColor(AMBER)
    c.setLineWidth(0.7)
    c.rect(LM,y-wh,CW,wh,fill=0,stroke=1)
    fl(LM,y-wh,4*mm,wh,AMBER)
    t(LM+7*mm,y-7*mm,"MANUFACTURER NOTES - SMA Sunny Boy SB1200","Helvetica-Bold",9,AMBER)
    for i,wl in enumerate(["Must not be mounted on wood or combustible materials. Requires minimum","400mm clearance at top, 200mm sides and bottom to prevent thermal derating.","Install only on non-combustible surfaces - metal, masonry or concrete.","NOTE: This installation does not comply - see finding FI-001."]):
        t(LM+7*mm,y-14*mm-i*5.5*mm,wl,"Helvetica",8.5,GREY_DK)
    y-=wh+10*mm
    fl(LM,y-10*mm,CW,10*mm,NAVY)
    fl(LM,y-10*mm,4*mm,10*mm,GREEN)
    t(LM+8*mm,y-7*mm,"SOLAR PANELS - Sanyo HIT-200BA3","Helvetica-Bold",9,WHITE)
    y-=10*mm
    panel_specs=[("Rated Power","200 Wp"),("Voc","51.6 V"),("Vmp","42.8 V"),("Isc","5.97 A"),("Imp","5.58 A"),("Max System Voltage","600 V"),("Cell Type","HIT (Heterojunction)"),("Module Efficiency","16.8%"),("Dimensions","1580 x 798 x 35mm"),("Weight","16.5 kg")]
    sy4=y
    for ri,(k,v) in enumerate(panel_specs[:5]):
        y=kv(LM,y,half,k,v,alt=ri%2==0)
    y3=sy4
    for ri,(k,v) in enumerate(panel_specs[5:]):
        y3=kv(LM+half+4*mm,y3,half,k,v,alt=ri%2==0)

    # PAGE 5: TEST RESULTS
    np()
    y=H-32*mm
    y=sec(y,"4","Array Test Results")
    TR_H=13*mm
    cx=[LM,LM+76*mm,LM+114*mm,LM+152*mm]
    fl(LM,y-10*mm,CW,10*mm,NAVY)
    for hdr,hx,hw2 in zip(["TEST","MEASURED VALUE","LIMIT / EXPECTED","RESULT"],cx,[76*mm,38*mm,38*mm,CW-152*mm]):
        t(hx+(hw2/2 if hdr!="TEST" else 4*mm),y-6.8*mm,hdr,"Helvetica-Bold",8,WHITE,"center" if hdr!="TEST" else "left")
    y-=10*mm
    for ri,(test,meas,lim,res) in enumerate(TEST_RESULTS):
        bg=RED_LT if res is False else (GREY_LT if ri%2==0 else WHITE)
        fl(LM,y-TR_H,CW,TR_H,bg)
        c.setStrokeColor(GREY_MID)
        c.setLineWidth(0.3)
        c.line(LM,y-TR_H,RM,y-TR_H)
        if res is False: fl(LM,y-TR_H,4*mm,TR_H,RED)
        mc=RED if res is False else (GREEN if res is True else DARK)
        t(cx[0]+5*mm,y-9*mm,test[:42],"Helvetica",9,DARK if res is not False else RED)
        t(cx[1]+19*mm,y-9*mm,meas,"Helvetica-Bold",10.5,mc,"center")
        t(cx[2]+19*mm,y-9*mm,lim,"Helvetica",8.5,GREY,"center")
        pbadge(cx[3]+(RM-cx[3]-16*mm)/2,y-10*mm,res)
        y-=TR_H

    # PAGE 6: CHECKLIST
    np()
    y=H-32*mm
    y=sec(y,"5","Inspection Checklist")
    CL_H=8.5*mm
    cx2=[LM,LM+80*mm,LM+96*mm,LM+133*mm,LM+158*mm]
    fl(LM,y-8*mm,CW,8*mm,NAVY)
    for hdr,hx in zip(["INSPECTION ITEM","ANSWER","NOTES","RISK"],cx2):
        t(hx+3*mm,y-5.5*mm,hdr,"Helvetica-Bold",7.5,WHITE)
    y-=8*mm
    for sname,items in CHECKLIST:
        if y<30*mm:
            np()
            y=H-32*mm
            t(LM,y,"SECTION 5 - Inspection Checklist (continued)","Helvetica-Bold",10,colors.HexColor("#0891b2"))
            y-=10*mm
        flagged=sum(1 for r in items if r[1] in ["No","FI"])
        fl(LM,y-8*mm,CW,8*mm,colors.HexColor("#f1f5f9"))
        c.setStrokeColor(GREY_MID)
        c.setLineWidth(0.4)
        c.line(LM,y-8*mm,RM,y-8*mm)
        fl(LM,y-8*mm,4*mm,8*mm,BLUE)
        t(LM+8*mm,y-5.5*mm,sname.upper(),"Helvetica-Bold",8.5,GREY_DK)
        if flagged: t(RM-4*mm,y-5.5*mm,f"{flagged} flagged","Helvetica-Bold",7.5,RED,"right")
        y-=8*mm
        for ri,(q,ans,note,risk) in enumerate(items):
            if y<22*mm:
                np()
                y=H-32*mm
                t(LM,y,"SECTION 5 - Inspection Checklist (continued)","Helvetica-Bold",10,colors.HexColor("#0891b2"))
                y-=10*mm
            isf=ans in ["No","FI"]
            fl(LM,y-CL_H,CW,CL_H,RED_LT if isf else (GREY_LT if ri%2==0 else WHITE))
            c.setStrokeColor(GREY_MID)
            c.setLineWidth(0.2)
            c.line(LM,y-CL_H,RM,y-CL_H)
            if isf: fl(LM,y-CL_H,3*mm,CL_H,RED)
            qs=q[:52]+"..." if len(q)>52 else q
            t(cx2[0]+5*mm,y-6*mm,qs,"Helvetica",8.5,DARK if isf else GREY_DK)
            if ans!="--": abadge(cx2[1]+2*mm,y-7*mm,ans)
            else: t(cx2[1]+3*mm,y-6*mm,note[:18]+"..." if len(note)>18 else note,"Helvetica",8,GREY_DK)
            if ans!="--" and note:
                ns=note[:30]+"..." if len(note)>30 else note
                t(cx2[2]+3*mm,y-6*mm,ns,"Helvetica",7.5,GREY)
            if risk: cbadge(cx2[4]+2*mm,y-7*mm,risk)
            y-=CL_H

    # PAGE 7: COMPLIANCE FINDINGS
    np()
    y=H-32*mm
    y=sec(y,"6","Compliance Findings")
    t(LM,y,"C2 - Potentially Dangerous (urgent)   C3 - Improvement Recommended   FI - Further Investigation Required","Helvetica",8.5,GREY)
    y-=10*mm
    FIND_H=28*mm
    for code,issue,reg,action in FINDINGS:
        if y<38*mm:
            np()
            y=H-32*mm
            t(LM,y,"SECTION 6 - Compliance Findings (continued)","Helvetica-Bold",10,colors.HexColor("#0891b2"))
            y-=10*mm
        col=RED if code=="C2" else AMBER if code=="C3" else PURPLE
        lt=RED_LT if code=="C2" else AMBER_LT if code=="C3" else PURPLE_LT
        fl(LM,y-FIND_H,CW,FIND_H,lt)
        c.setStrokeColor(col)
        c.setLineWidth(0.6)
        c.rect(LM,y-FIND_H,CW,FIND_H,fill=0,stroke=1)
        fl(LM,y-FIND_H,4*mm,FIND_H,col)
        cbadge(LM+7*mm,y-8*mm,code)
        t(LM+21*mm,y-6.5*mm,issue[:85],"Helvetica-Bold",9.5,DARK)
        t(LM+7*mm,y-14*mm,reg,"Helvetica",8,PURPLE)
        t(LM+7*mm,y-20*mm,"Recommended: "+action[:88],"Helvetica",8.5,GREY_DK)
        if len(action)>88: t(LM+7*mm,y-25*mm,action[88:],"Helvetica",8.5,GREY_DK)
        y-=FIND_H+4*mm

    # PAGE 8: CONDITIONALITY
    np()
    y=H-32*mm
    y=sec(y,"7","System Conditionality Assessment")
    t(LM,y,"Indicative component life forecast based on system age and visual inspection at time of visit.","Helvetica",9,GREY)
    y-=5*mm
    t(LM,y,"This does not constitute a guarantee of component performance - see disclaimer below.","Helvetica-Bold",8.5,AMBER)
    y-=10*mm

    # Table header
    fl(LM,y-9*mm,CW,9*mm,NAVY)
    cx3=[LM,LM+65*mm,LM+95*mm,LM+125*mm,LM+158*mm]
    for hdr,hx in zip(["COMPONENT","AGE","RATING","CONDITION","EST. REMAINING"],cx3):
        t(hx+2*mm,y-6.2*mm,hdr,"Helvetica-Bold",7.5,WHITE)
    y-=9*mm

    overall_rating=1
    for i,(comp_name,comp_age,expected,replace_range) in enumerate(COMP_LIFE):
        rating,col,lt,label=get_cond(comp_age,expected)
        overall_rating=max(overall_rating,rating)
        bg=GREY_LT if i%2==0 else WHITE
        fl(LM,y-10*mm,CW,10*mm,bg)
        c.setStrokeColor(GREY_MID)
        c.setLineWidth(0.2)
        c.line(LM,y-10*mm,RM,y-10*mm)
        t(cx3[0]+2*mm,y-7*mm,comp_name,"Helvetica",9.5,GREY_DK)
        t(cx3[1]+2*mm,y-7*mm,f"{comp_age} yrs","Helvetica",9,GREY)
        # Rating circle
        c.setFillColor(col)
        c.circle(cx3[2]+6*mm,y-5*mm,5,fill=1,stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold",8)
        c.drawCentredString(cx3[2]+6*mm,y-6.5*mm,str(rating))
        t(cx3[3]+2*mm,y-7*mm,label,"Helvetica-Bold",9,col)
        t(cx3[4]+2*mm,y-7*mm,replace_range,"Helvetica",8.5,GREY)
        y-=10*mm

    y-=8*mm
    # Overall rating
    overall_col=[None,GREEN,BLUE,AMBER,ORANGE,RED][overall_rating]
    overall_label=["","Excellent","Good","Monitor","Attention Required","End of Life"][overall_rating]
    fl(LM,y-24*mm,CW,24*mm,GREY_LT)
    c.setStrokeColor(overall_col)
    c.setLineWidth(1.5)
    c.rect(LM,y-24*mm,CW,24*mm,fill=0,stroke=1)
    t(LM+CW/2,y-8*mm,"OVERALL CONDITIONALITY RATING","Helvetica-Bold",8,GREY,"center")
    c.setFillColor(overall_col)
    c.circle(LM+CW/2-20*mm,y-15*mm,7,fill=1,stroke=0)
    c.setFillColor(WHITE)
    c.setFont("Helvetica-Bold",10)
    c.drawCentredString(LM+CW/2-20*mm,y-17*mm,str(overall_rating))
    t(LM+CW/2-11*mm,y-14*mm,overall_label,"Helvetica-Bold",14,overall_col)
    y-=32*mm

    # Rating key 2-col
    t(LM,y,"RATING KEY","Helvetica-Bold",8.5,GREY_DK)
    y-=6*mm
    key_items=[(1,GREEN,"Excellent","No action required"),(2,BLUE,"Good","Routine maintenance only"),(3,AMBER,"Monitor","Approaching mid-life"),(4,ORANGE,"Attention","Replacement within 3 years"),(5,RED,"End of Life","Immediate replacement")]
    kw=(CW-4*mm)/2
    for i,(r,col,label,desc) in enumerate(key_items):
        kx=LM if i%2==0 else LM+kw+4*mm
        ky=y-(i//2)*12*mm
        bx(kx,ky-10*mm,kw,10*mm,GREY_LT,GREY_MID,0.3)
        c.setFillColor(col)
        c.circle(kx+6*mm,ky-5*mm,4.5,fill=1,stroke=0)
        c.setFillColor(WHITE)
        c.setFont("Helvetica-Bold",7.5)
        c.drawCentredString(kx+6*mm,ky-6.5*mm,str(r))
        t(kx+13*mm,ky-4*mm,label,"Helvetica-Bold",8.5,GREY_DK)
        t(kx+13*mm,ky-9*mm,desc,"Helvetica",7.5,GREY)
    y-=36*mm

    # Disclaimer
    dh=24*mm
    fl(LM,y-dh,CW,dh,AMBER_LT)
    c.setStrokeColor(AMBER)
    c.setLineWidth(0.7)
    c.rect(LM,y-dh,CW,dh,fill=0,stroke=1)
    fl(LM,y-dh,4*mm,dh,AMBER)
    t(LM+7*mm,y-7*mm,"IMPORTANT -- INDICATIVE FORECAST ONLY","Helvetica-Bold",8.5,AMBER)
    for i,dl in enumerate(["This conditionality assessment is based on typical component lifespans and visual inspection at","time of visit. Actual replacement timelines may vary depending on usage, maintenance history","and environmental conditions. This assessment does not constitute a guarantee of component","performance, structural survey or specialist report. No liability is accepted by Themis","Diagnostics or the inspecting engineer for component failure outside of stated findings."]):
        t(LM+7*mm,y-14*mm-i*4.8*mm,dl,"Helvetica",8,GREY_DK)

    # PAGES 9-10: PHOTOS
    np()
    y=H-32*mm
    y=sec(y,"8","Photo Evidence")
    t(LM,y,"All photos geo-stamped with date, time, GPS coordinates and engineer name at capture.","Helvetica",9,GREY)
    y-=9*mm
    pw=(CW-5*mm)/2
    ph=52*mm
    for i,(path,cap) in enumerate([(f"{PHOTOS}/06_panels.jpg","Fig 1 - Solar panels 4x Sanyo HIT-200BA3 | South | Moss noted on roof tiles"),(f"{PHOTOS}/01_inverter.jpg","Fig 2 - SMA Sunny Boy SB1200 | Loft | Clearance deficiency visible"),(f"{PHOTOS}/02_dc_isolator.jpg","Fig 3 - DC switch disconnector | Correctly labelled | Adjacent to inverter"),(f"{PHOTOS}/03_ac_isolator.jpg","Fig 4 - AC isolator | IP2x NOT MET (C2) | Missing cover plate")]):
        px=LM if i%2==0 else LM+pw+5*mm
        py=y-ph if i<2 else y-ph*2-13*mm
        c.setStrokeColor(GREY_MID)
        c.setLineWidth(0.5)
        c.rect(px,py,pw,ph,fill=0,stroke=1)
        photo(path,px,py,pw,ph,cap)

    np()
    y=H-32*mm
    t(LM,y,"SECTION 8 - Photo Evidence (continued)","Helvetica-Bold",11,colors.HexColor("#0891b2"))
    y-=12*mm
    for i,(path,cap) in enumerate([(f"{PHOTOS}/05_consumer_unit.jpg","Fig 5 - Consumer unit (Volex) | Type AC RCD installed | Type A required (C3)"),(f"{PHOTOS}/07_rcd_closeup.jpg","Fig 6 - RCD close-up | Type AC BS61008 | Replace with Type A (C3)")]):
        px=LM+i*(pw+5*mm)
        c.setStrokeColor(GREY_MID)
        c.setLineWidth(0.5)
        c.rect(px,y-ph,pw,ph,fill=0,stroke=1)
        photo(path,px,y-ph,pw,ph,cap)
    y-=ph+13*mm
    ph2=62*mm
    c.setStrokeColor(GREY_MID)
    c.setLineWidth(0.5)
    c.rect(LM,y-ph2,CW,ph2,fill=0,stroke=1)
    photo(f"{PHOTOS}/04_meter.jpg",LM,y-ph2,CW,ph2,"Fig 7 - Generation meter Landis+Gyr 5235B | Serial: A471077465 | Reading: 005065.1 kWh")

    # FINAL PAGE: SIGN OFF
    np()
    y=H-32*mm
    y=sec(y,"9","Declaration & Sign-off")
    decl=["I/We, being the person(s) responsible for the inspection and testing of the solar PV","installation described in this report, having exercised reasonable skill and care when","carrying out the inspection and testing, hereby declare that the information in this","report provides an accurate assessment of the condition of the installation at the","time of inspection, taking into account the stated extent and limitations."]
    dh2=len(decl)*6*mm+10*mm
    fl(LM,y-dh2,CW,dh2,BLUE_LT)
    c.setStrokeColor(BLUE)
    c.setLineWidth(0.5)
    c.rect(LM,y-dh2,CW,dh2,fill=0,stroke=1)
    fl(LM,y-dh2,4*mm,dh2,BLUE)
    dy=y-7*mm
    for dl in decl:
        t(LM+7*mm,dy,dl,"Helvetica",9.5,GREY_DK)
        dy-=6*mm
    y-=dh2+10*mm
    for role,name,pos,dv in [("ENGINEER SIGN-OFF","L. McKenna","Solar PV Engineer / Electrician","01/08/2024"),("QUALIFIED SUPERVISOR SIGN-OFF","","Qualified Supervisor","")]:
        bh=48*mm
        fl(LM,y-bh,CW,bh,GREY_LT)
        c.setStrokeColor(GREY_MID)
        c.setLineWidth(0.5)
        c.rect(LM,y-bh,CW,bh,fill=0,stroke=1)
        fl(LM,y-10*mm,CW,10*mm,NAVY)
        t(LM+5*mm,y-7*mm,role,"Helvetica-Bold",9,WHITE)
        y-=10*mm
        for fi,(k,v) in enumerate([("Name",name),("Position",pos),("Date",dv)]):
            fl(LM,y-10*mm,CW,10*mm,colors.HexColor("#f1f5f9") if fi%2==0 else WHITE)
            c.setStrokeColor(GREY_MID)
            c.setLineWidth(0.2)
            c.line(LM,y-10*mm,RM,y-10*mm)
            t(LM+4*mm,y-7*mm,k,"Helvetica",9,GREY)
            t(LM+42*mm,y-7*mm,v,"Helvetica-Bold",10,DARK)
            y-=10*mm
        t(LM+4*mm,y-6*mm,"Signature","Helvetica",9,GREY)
        c.setStrokeColor(GREY_MID)
        c.setLineWidth(0.8)
        c.line(LM+42*mm,y-9*mm,RM-15*mm,y-9*mm)
        y-=18*mm
    y-=8*mm
    fl(LM,y-20*mm,CW,20*mm,DARK)
    t(LM+6*mm,y-8*mm,"THEMIS","Helvetica-Bold",13,GREEN)
    t(LM+6*mm,y-15*mm,"Solar PV Inspection Platform","Helvetica",8.5,colors.HexColor("#94a3b8"))
    t(RM-6*mm,y-8*mm,"Certificate: TH-2024-0002","Helvetica",8,colors.HexColor("#94a3b8"),"right")
    t(RM-6*mm,y-15*mm,"01 August 2024  |  TH-2024-002","Helvetica",8,colors.HexColor("#94a3b8"),"right")

    c.save()
    print(f"Saved: {OUT}")
    print(f"Pages: {pn[0]}")

build()
