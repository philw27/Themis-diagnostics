// Themis Diagnostics v3.1 - build 3
import { useState, useRef, useCallback, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// - SUPABASE CLIENT --------------
const SUPABASE_URL = "https://mvratboyodudbgcmwtku.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmF0Ym95b2R1ZGJnY213dGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTU0ODUsImV4cCI6MjA5Mjc5MTQ4NX0.2GQaY76N9KKXkKBxRU5ZCzthttUh49WM0J2Pd1QJw4U";

const sb = {
// - AUTH -------------------------
async signIn(email, password) {
const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=password", {
method: "POST",
headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
body: JSON.stringify({ email, password }),
});
return res.json();
},

async signUp(email, password, fullName, role) {
const res = await fetch(SUPABASE_URL + "/auth/v1/signup", {
method: "POST",
headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
body: JSON.stringify({ email, password, data: { full_name: fullName, role } }),
});
return res.json();
},

async signOut(token) {
await fetch(SUPABASE_URL + "/auth/v1/logout", {
method: "POST",
headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + token },
});
},

async refreshSession(refreshToken) {
const res = await fetch(SUPABASE_URL + "/auth/v1/token?grant_type=refresh_token", {
method: "POST",
headers: { "Content-Type": "application/json", "apikey": SUPABASE_KEY },
body: JSON.stringify({ refresh_token: refreshToken }),
});
return res.json();
},

// - DATABASE -----------------------
async query(table, token, options = {}) {
let url = SUPABASE_URL + "/rest/v1/" + table + "?";
if (options.select)  url += "select=" + options.select + "&";
if (options.filter)  url += options.filter + "&";
if (options.order)   url += "order=" + options.order + "&";
if (options.limit)   url += "limit=" + options.limit + "&";
const res = await fetch(url, {
headers: {
"apikey": SUPABASE_KEY,
"Authorization": "Bearer " + token,
"Content-Type": "application/json",
},
});
return res.json();
},

async insert(table, token, data) {
const res = await fetch(SUPABASE_URL + "/rest/v1/" + table, {
method: "POST",
headers: {
"apikey": SUPABASE_KEY,
"Authorization": "Bearer " + token,
"Content-Type": "application/json",
"Prefer": "return=representation",
},
body: JSON.stringify(data),
});
return res.json();
},

async upsert(table, token, data, onConflict) {
// Try INSERT first, if duplicate then UPDATE
const url = SUPABASE_URL + "/rest/v1/" + table +
(onConflict ? "?on_conflict=" + onConflict : "");
const res = await fetch(url, {
method: "POST",
headers: {
"apikey": SUPABASE_KEY,
"Authorization": "Bearer " + token,
"Content-Type": "application/json",
"Prefer": "resolution=merge-duplicates,return=representation",
},
body: JSON.stringify(data),
});
if (res.ok) {
const text = await res.text();
try { return JSON.parse(text); } catch(e) { return text; }
}
// If failed, try PATCH on the conflict column
if (onConflict && res.status === 409) {
const conflictCol = onConflict.split(",")[0];
const conflictVal = Array.isArray(data) ? data[0][conflictCol] : data[conflictCol];
const patchUrl = SUPABASE_URL + "/rest/v1/" + table + "?" + conflictCol + "=eq." + conflictVal;
const patchRes = await fetch(patchUrl, {
method: "PATCH",
headers: {
"apikey": SUPABASE_KEY,
"Authorization": "Bearer " + token,
"Content-Type": "application/json",
"Prefer": "return=representation",
},
body: JSON.stringify(Array.isArray(data) ? data[0] : data),
});
const patchText = await patchRes.text();
try { return JSON.parse(patchText); } catch(e) { return patchText; }
}
const text = await res.text();
console.log("Upsert response:", res.status, text.slice(0,200));
try { return JSON.parse(text); } catch(e) { return text; }
},

async update(table, token, data, filter) {
const res = await fetch(SUPABASE_URL + "/rest/v1/" + table + "?" + filter, {
method: "PATCH",
headers: {
"apikey": SUPABASE_KEY,
"Authorization": "Bearer " + token,
"Content-Type": "application/json",
"Prefer": "return=representation",
},
body: JSON.stringify(data),
});
return res.json();
},

async uploadPhoto(token, jobId, itemId, dataUrl, filename) {
// Convert base64 dataUrl to blob
const base64 = dataUrl.split(",")[1];
const binary = atob(base64);
const arr = new Uint8Array(binary.length);
for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
const blob = new Blob([arr], { type: "image/jpeg" });
const path = jobId + "/" + itemId + "/" + filename;
const res = await fetch(SUPABASE_URL + "/storage/v1/object/photos/" + path, {
method: "POST",
headers: {
"apikey": SUPABASE_KEY,
"Authorization": "Bearer " + token,
"Content-Type": "image/jpeg",
},
body: blob,
});
if (res.ok) {
return SUPABASE_URL + "/storage/v1/object/public/photos/" + path;
}
return null;
},
};

const CARD2 = "linear-gradient(135deg,#f8fafc,#f1f5f9)";
const C = {
bg:      "#f1f5f9",
surface: "#ffffff",
card:    "#ffffff",
border:  "#e2e8f0",
green:   "#059669",
blue:    "#0284c7",
amber:   "#d97706",
red:     "#dc2626",
purple:  "#7c3aed",
text:    "#1e293b",
muted:   "#64748b",
accent:  "#0891b2",
dim:     "#475569",
navy:    "#1e3a5f",
};

const S = {
app:{ background:"#f1f5f9", minHeight:"100vh", fontFamily:"'Inter','Helvetica Neue',Arial,sans-serif", color:"#1e293b", maxWidth:500, margin:"0 auto", fontSize:15 },
header:{ background:"#1e3a5f", borderBottom:"3px solid #059669", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 },
logo:{ fontSize:17, fontWeight:700, letterSpacing:"0.06em", color:"#ffffff", display:"flex", alignItems:"center", gap:8 },
card:{ background:"#ffffff", border:"1px solid #e2e8f0", borderRadius:10, padding:18, marginBottom:12, boxShadow:"0 1px 6px rgba(0,0,0,0.06)" },
btn:(v="primary")=>({ background:v==="primary"?"#1e3a5f":v==="danger"?"#dc2626":v==="green"?"#059669":"transparent", color:v==="ghost"?"#1e3a5f":"#ffffff", border:v==="ghost"?"1.5px solid #1e3a5f":"none", borderRadius:8, padding:"13px 18px", fontSize:14, fontWeight:700, cursor:"pointer", width:"100%", letterSpacing:"0.01em", fontFamily:"inherit", marginBottom:8, display:"block" }),
input:{ background:"#ffffff", border:"1.5px solid #e2e8f0", borderRadius:8, padding:"12px 14px", color:"#1e293b", fontSize:15, width:"100%", fontFamily:"inherit", boxSizing:"border-box", outline:"none" },
label:{ fontSize:11, color:"#64748b", letterSpacing:"0.05em", textTransform:"uppercase", marginBottom:5, display:"block", fontWeight:600 },
secTitle:{ fontSize:11, color:"#1e3a5f", letterSpacing:"0.08em", textTransform:"uppercase", fontWeight:700, marginBottom:14, paddingBottom:8, borderBottom:"2px solid #059669" },
tag:(col)=>({ background:col+"22", color:col, border:`1px solid ${col}44`, borderRadius:5, padding:"2px 7px", fontSize:10, fontWeight:700, letterSpacing:"0.06em", display:"inline-block" }),
};

// - CHECKLIST DATA --------------
const SECTIONS = [
{ id:"panels", label:"Solar Panels", items:[
{id:"sp1",q:"Orientation of solar panels",type:"select",opts:["South","South-East","South-West","East","West","Flat roof"]},
{id:"sp2",q:"Number of solar panels",type:"number"},
{id:"sp3",q:"Location of solar panels",type:"select",opts:["Front","Rear","Side","Flat roof","Ground mount"]},
{id:"sp4",q:"Are the panels damaged?",invert:true},
{id:"sp5",q:"Are the panels clean / clear of debris?"},
{id:"sp6",q:"Can the panel make be identified?"},
{id:"sp7",q:"Do PV array cables appear to be secure?"},
{id:"sp8",q:"Has array frame equipotential bonding been installed? (IEC 60364-7-712)"},
{id:"sp9",q:"Is there evidence of bird / pest damage or fouling?",invert:true},
{id:"sp10",q:"Are all junction boxes secure and undamaged?"},
]},
{ id:"inverter", label:"Inverter", items:[
{id:"inv1",q:"Make",type:"text"},
{id:"inv2",q:"Model",type:"text"},
{id:"inv3",q:"Serial number",type:"text"},
{id:"inv4",q:"Location",type:"select",opts:["Loft","Garage","Cupboard","External","Meter room","Plant room"]},
{id:"inv5",q:"Is there a smoke detector present at the inverter location? (BS 5839-6)"},
{id:"inv6",q:"Is the inverter functioning correctly?"},
{id:"inv7",q:"Is the inverter clear of debris?"},
{id:"inv8",q:"Does the inverter have the correct recommended clearances? (BS 7671 reg 134.1.1)"},
{id:"inv9",q:"Is the inverter installed on a heat resistant / non-combustible material?"},
{id:"inv10",q:"Is the inverter securely mounted?"},
{id:"inv11",q:"Are all LED indicators functioning correctly?"},
]},
{ id:"isolation", label:"Isolation", items:[
{id:"iso1",q:"Is there a DC switch disconnector fitted to DC side of inverter? (IEC 60364-7-712.536.2.2.5)"},
{id:"iso2",q:"Is the DC isolator correctly labelled?"},
{id:"iso3",q:"Is the DC isolator in good working condition?"},
{id:"iso4",q:"Is there an AC switch disconnector installed?"},
{id:"iso5",q:"Is the AC isolator correctly labelled?"},
{id:"iso6",q:"Is the AC isolator in good working condition?"},
{id:"iso7",q:"Is the AC isolator correctly installed and meeting minimum IP2x? (BS 7671 416.2.1)"},
{id:"iso8",q:"Is there an AC isolator local to the distribution equipment?"},
]},
{ id:"ac_supply", label:"AC Supply", items:[
{id:"ac1",q:"Is the installation protected by an RCD?"},
{id:"ac2",q:"RCD BS number",type:"select",opts:["61008","61009","62423"]},
{id:"ac3",q:"RCD type",type:"select",opts:["Type A","Type B","Type F","Type AC"]},
{id:"ac4",q:"Is the RCD bidirectional rated? (BS 7671 531.3.3)"},
{id:"ac5",q:"Is there surge protection (SPD) present?"},
{id:"ac6",q:"Is the array framework equipotential bonded?"},
]},
{ id:"labelling", label:"Labelling & Documentation", items:[
{id:"lab1",q:"Are all circuits, protective devices, switches and terminals suitably labelled?"},
{id:"lab2",q:"Is the main AC isolator clearly labelled?"},
{id:"lab3",q:"Are dual supply warning labels fitted at point of interconnection? (BS 7671 712.514)"},
{id:"lab4",q:"Is a single line wiring diagram displayed on site? (IET CoP 9.7b)"},
{id:"lab5",q:"Are inverter protection settings and installer details displayed?"},
{id:"lab6",q:"Are emergency shutdown procedures displayed on site?"},
{id:"lab7",q:"Are all DC junction boxes carrying warning labels?"},
]},
{ id:"meter", label:"Generation Meter", items:[
{id:"met1",q:"Make",type:"text"},
{id:"met2",q:"Model",type:"text"},
{id:"met3",q:"Serial number",type:"text"},
{id:"met4",q:"Current meter reading",type:"number"},
{id:"met5",q:"Is the meter accessible and readable?"},
{id:"met6",q:"Is the meter correctly labelled?"},
]},
{ id:"mechanical", label:"General / Mechanical", items:[
{id:"mec1",q:"Is ventilation provided behind the array to prevent overheating?"},
{id:"mec2",q:"Is the array frame and material corrosion proof?"},
{id:"mec3",q:"Is the array frame correctly fixed and stable with weatherproof roof fixings?"},
{id:"mec4",q:"Is the cable entry weatherproof?"},
]},
];

const ANSWER_OPTS = [
{val:"yes",label:"Yes",col:C.green},
{val:"no",label:"No",col:C.red},
{val:"lim",label:"Lim",col:C.amber},
{val:"fi",label:"FI",col:C.purple},
{val:"na",label:"N/A",col:C.muted},
];

const RISK_TAGS = [
{val:"C2",col:C.red},{val:"C3",col:C.amber},{val:"FI",col:C.purple},
];

// - PHOTO CAPTURE ---------------
function PhotoCapture({ photos, onAdd, onRemove, engineerName, stampEnabled }) {
const ref = useRef();
const [busy, setBusy] = useState(false);

const process = useCallback(async (files) => {
setBusy(true);
const results = [];
for (const file of files) {
await new Promise(res => {
const reader = new FileReader();
reader.onload = e => {
const img = new window.Image();
img.onload = () => {
const canvas = document.createElement("canvas");
canvas.width = img.width; canvas.height = img.height;
const ctx = canvas.getContext("2d");
ctx.drawImage(img, 0, 0);
if (stampEnabled) {
const barH = Math.max(52, img.height * 0.08);
ctx.fillStyle = "rgba(0,0,0,0.75)";
ctx.fillRect(0, img.height - barH, img.width, barH);
const fs = Math.max(14, Math.round(barH * 0.28));
const now = new Date();
ctx.font = `bold ${fs}px monospace`;
ctx.fillStyle = "#00c97a";
ctx.fillText(now.toLocaleDateString("en-GB") + " " + now.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"}), 10, img.height - barH + fs + 4);
if (engineerName) {
ctx.fillStyle = "#00d4ff";
ctx.fillText(engineerName, 10, img.height - barH + fs * 2 + 8);
}
if (navigator.geolocation) {
navigator.geolocation.getCurrentPosition(pos => {
ctx.font = `${Math.max(11,Math.round(fs*0.75))}px monospace`;
ctx.fillStyle = "#8aa0b8";
ctx.fillText(pos.coords.latitude.toFixed(5)+", "+pos.coords.longitude.toFixed(5), img.width-200, img.height-8);
results.push({id:Date.now()+Math.random(),dataUrl:canvas.toDataURL("image/jpeg",0.85),name:file.name});
res();
}, () => { results.push({id:Date.now()+Math.random(),dataUrl:canvas.toDataURL("image/jpeg",0.85),name:file.name}); res(); }, {timeout:2000});
} else {
results.push({id:Date.now()+Math.random(),dataUrl:canvas.toDataURL("image/jpeg",0.85),name:file.name});
res();
}
} else {
results.push({id:Date.now()+Math.random(),dataUrl:canvas.toDataURL("image/jpeg",0.85),name:file.name});
res();
}
};
img.src = e.target.result;
};
reader.readAsDataURL(file);
});
}
onAdd(results);
setBusy(false);
}, [engineerName, stampEnabled, onAdd]);

return (
<div style={{marginTop:8}}>
<div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:photos.length?8:0}}>
{photos.map(p => (
<div key={p.id} style={{position:"relative",width:70,height:70}}>
<img src={p.dataUrl} alt="" style={{width:70,height:70,objectFit:"cover",borderRadius:8,border:`1px solid ${C.border}`}}/>
<button onClick={()=>onRemove(p.id)} style={{position:"absolute",top:-6,right:-6,background:C.red,border:"none",borderRadius:"50%",width:18,height:18,color:"#fff",fontSize:11,cursor:"pointer",fontWeight:700}}>x</button>
</div>
))}
<button onClick={()=>ref.current.click()} disabled={busy} style={{width:70,height:70,background:"#f8fafc",border:`1.5px dashed ${C.border}`,borderRadius:8,color:busy?C.muted:C.accent,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:2}}>
{busy?"...":(<>📷<span style={{fontSize:9,color:C.muted}}>Add</span></>)}
</button>
</div>
<input ref={ref} type="file" accept="image/*" multiple capture="environment" style={{display:"none"}} onChange={e=>process(Array.from(e.target.files))}/>
</div>
);
}

// - LOCAL AI ENGINE --------------
function runAnalysis(job, asset, checklist, testResults, flaggedItems) {
const risks = [], missing = [], actions = [];
const a = checklist || {};
const tr = testResults || {};
const ast = asset || {};

const ans  = id => a[id]?.answer || null;
const val  = id => a[id]?.value  || "";
const pics = id => (a[id]?.photos || []).length;
const isNA = id => ans(id) === "na";

// - ASSET / SERIAL NUMBERS ----------
if (!ast.panel_count && !val("sp2"))  missing.push("Number of solar panels not recorded");
if (!ast.panel_make  && !val("inv1") && !isNA("sp6")) missing.push("Panel make not identified - record or mark N/A");
if (!ast.inverter_make  && !val("inv1")) missing.push("Inverter make not recorded");
if (!ast.inverter_model && !val("inv2")) missing.push("Inverter model not recorded");
if (!ast.inverter_serial && !val("inv3")) {
missing.push("Inverter serial number not recorded");
risks.push({code:"FI",issue:"Inverter serial number not recorded",regulation:"Asset management / warranty",recommended_action:"Record serial number from inverter type label"});
}
if (!ast.meter_serial && !val("met3")) {
missing.push("Generation meter serial number not recorded");
risks.push({code:"FI",issue:"Generation meter serial number not recorded",regulation:"FIT/SEG records",recommended_action:"Record serial number from meter face"});
}
if (!ast.meter_reading && !val("met4") && !isNA("met4")) missing.push("Generation meter reading not recorded");
if (!ast.system_age) missing.push("System age not recorded");
if (!ast.inverter_loc && !val("inv4")) missing.push("Inverter location not recorded");

// - PHOTO EVIDENCE -------------------
const photoReq = [
["inv3","Inverter serial number label"],
["inv1","Inverter unit"],
["iso1","DC isolator"],
["iso4","AC isolator"],
["met3","Generation meter"],
["sp4", "Solar panels (roof)"],
["ac1", "Consumer unit / RCD"],
];
photoReq.forEach(([id, label]) => {
if (!isNA(id) && pics(id) === 0) missing.push("Photo required: " + label + " - none uploaded");
});

// - UNANSWERED YES/NO ITEMS ----------
const yesNo = [
["sp4","Panels damaged - not inspected"],
["sp5","Panels clean/clear - not inspected"],
["sp7","PV array cables secure - not inspected"],
["sp8","Array frame equipotential bonding - not inspected"],
["sp9","Bird/pest damage - not inspected"],
["sp10","Junction boxes secure - not inspected"],
["inv5","Smoke detector at inverter - not inspected"],
["inv6","Inverter functioning correctly - not inspected"],
["inv7","Inverter clear of debris - not inspected"],
["inv8","Inverter clearances correct - not inspected"],
["inv9","Inverter on non-combustible material - not inspected"],
["inv10","Inverter securely mounted - not inspected"],
["inv11","LED indicators functioning - not inspected"],
["iso1","DC switch disconnector fitted - not inspected"],
["iso2","DC isolator labelled - not inspected"],
["iso3","DC isolator working condition - not inspected"],
["iso4","AC switch disconnector installed - not inspected"],
["iso5","AC isolator labelled - not inspected"],
["iso6","AC isolator working condition - not inspected"],
["iso7","AC isolator IP2x rating - not inspected"],
["ac1","RCD protection present - not inspected"],
["ac4","RCD bidirectional rated - not inspected"],
["ac5","Surge protection present - not inspected"],
["lab2","AC isolator labelled - not inspected"],
["lab3","Dual supply warning labels - not inspected"],
["lab4","Single line wiring diagram on site - not inspected"],
["lab6","Emergency shutdown procedure displayed - not inspected"],
["lab7","DC junction box warning labels - not inspected"],
["met5","Meter accessible and readable - not inspected"],
["met6","Meter correctly labelled - not inspected"],
["mec3","Array frame correctly fixed - not inspected"],
["mec4","Cable entry weatherproof - not inspected"],
];
yesNo.forEach(([id, label]) => {
if (!ans(id) && !val(id) && !isNA(id)) missing.push(label);
});

// - TEST RESULTS --------------------
if (!tr.voc)        missing.push("Voc (open circuit voltage) not recorded");
if (!tr.isc)        missing.push("Isc (short circuit current) not recorded");
if (!tr.irradiance) missing.push("Irradiance reading not recorded");
if (!tr.ir_pos)     missing.push("Insulation resistance pos-earth not recorded");
if (!tr.ir_neg)     missing.push("Insulation resistance neg-earth not recorded");
if (!tr.zs)         missing.push("Zs (earth fault loop impedance) not recorded");
if (!tr.rcd_trip)   missing.push("RCD trip time not recorded");
if (!tr.mcb_rating) missing.push("MCB rating not recorded");

// Test value safety
if (tr.ir_pos && parseFloat(tr.ir_pos) < 1)   risks.push({code:"C2",issue:"Insulation resistance pos-earth below 1MOhm - DC fault indicated",regulation:"IEC 60364-7-712",recommended_action:"Isolate system and investigate DC insulation fault immediately"});
if (tr.ir_neg && parseFloat(tr.ir_neg) < 1)   risks.push({code:"C2",issue:"Insulation resistance neg-earth below 1MOhm - DC fault indicated",regulation:"IEC 60364-7-712",recommended_action:"Isolate system and investigate DC insulation fault immediately"});
if (tr.rcd_trip && parseFloat(tr.rcd_trip) > 300) risks.push({code:"C2",issue:"RCD trip time exceeds 300ms maximum",regulation:"BS 7671 531.2",recommended_action:"Replace RCD - not operating within safe parameters"});
if (tr.polarity === "unsatisfactory")          risks.push({code:"C2",issue:"Polarity check unsatisfactory",regulation:"BS 7671",recommended_action:"Investigate and correct DC polarity immediately"});
if (tr.inverter_ok === "unsatisfactory")       risks.push({code:"C2",issue:"Inverter not functioning correctly",regulation:"BS 7671",recommended_action:"Investigate inverter fault before leaving site"});

// - SPEC COMPARISON --------------------
const iSpecs = ast.inverterSpecs;
const pSpecs = ast.panelSpecs;

if (iSpecs) {
// Voc comparison - adjust for irradiance
if (tr.voc && iSpecs.rated_voc_v) {
const measVoc   = parseFloat(tr.voc);
const ratedVoc  = parseFloat(iSpecs.rated_voc_v);
const irr       = tr.irradiance ? parseFloat(tr.irradiance) : 1000;
// Expected Voc at measured irradiance (approx - Voc is less irradiance-sensitive than Isc)
const expectedVoc = ratedVoc * (1 - 0.05 * Math.log(1000 / Math.max(irr, 1)));
const deviation   = Math.abs(measVoc - expectedVoc) / expectedVoc * 100;
if (deviation > 20) {
risks.push({code:"C3", issue:"Measured Voc (" + measVoc + "V) deviates " + deviation.toFixed(0) + "% from expected " + expectedVoc.toFixed(1) + "V at " + irr + "W/m2 - possible string fault or degradation", regulation:"IEC 60364-7-712 / Manufacturer datasheet", recommended_action:"Check string connections, bypass diodes and module condition"});
}
}

// Isc comparison - scales linearly with irradiance
if (tr.isc && pSpecs && pSpecs.isc_a && ast.panel_count) {
  const measIsc    = parseFloat(tr.isc);
  const ratedIsc   = parseFloat(pSpecs.isc_a);
  const irr        = tr.irradiance ? parseFloat(tr.irradiance) : 1000;
  const expectedIsc = ratedIsc * (irr / 1000);
  const deviation   = Math.abs(measIsc - expectedIsc) / expectedIsc * 100;
  if (deviation > 15) {
    risks.push({code:"C3", issue:"Measured Isc (" + measIsc + "A) deviates " + deviation.toFixed(0) + "% from expected " + expectedIsc.toFixed(2) + "A at " + irr + "W/m2", regulation:"IEC 60364-7-712 / Manufacturer datasheet", recommended_action:"Check for shading, soiling, or module faults - consider IV curve trace"});
  }
}

// Max DC voltage - string voltage vs inverter limit
if (tr.voc && iSpecs.max_dc_voltage_v) {
  const measVoc  = parseFloat(tr.voc);
  const maxDCVoc = parseFloat(iSpecs.max_dc_voltage_v);
  if (measVoc > maxDCVoc * 0.95) {
    risks.push({code:"C2", issue:"Measured Voc (" + measVoc + "V) is at or above inverter max DC input (" + maxDCVoc + "V) - risk of inverter damage", regulation:"IEC 60364-7-712.433 / Manufacturer datasheet", recommended_action:"Immediately review string configuration - reduce string length if required"});
  }
}

// Clearances
if (iSpecs.min_clearance_top_mm || iSpecs.min_clearance_sides_mm) {
  const topC  = iSpecs.min_clearance_top_mm  ? iSpecs.min_clearance_top_mm+"mm"  : "per datasheet";
  const sideC = iSpecs.min_clearance_sides_mm ? iSpecs.min_clearance_sides_mm+"mm" : "per datasheet";
  missing.push("Verify inverter clearances: top=" + topC + ", sides=" + sideC + " (from " + iSpecs._make + " " + iSpecs._model + " datasheet)");
}

// Mounting surface
if (iSpecs.mounting_surface) {
  missing.push("Confirm mounting surface is suitable: manufacturer requires " + iSpecs.mounting_surface);
}

// IP rating note
if (iSpecs.ip_rating) {
  missing.push("Confirm inverter location is appropriate for IP" + iSpecs.ip_rating + " rated unit (check dust/moisture exposure)");
}

}

if (pSpecs) {
// Max system voltage check
if (tr.voc && pSpecs.max_system_voltage_v && ast.panel_count) {
const measVoc    = parseFloat(tr.voc);
const maxSysV    = parseFloat(pSpecs.max_system_voltage_v);
if (measVoc > maxSysV) {
risks.push({code:"C2", issue:"String Voc (" + measVoc + "V) exceeds panel max system voltage (" + maxSysV + "V) - safety risk", regulation:"IEC 60364-7-712.433 / Panel datasheet", recommended_action:"Review string configuration immediately - reduce panels per string"});
}
}
}

// - COMPLIANCE BASELINE -----------
const rcdType = tr.rcd_type || val("ac3");
if (!rcdType || rcdType === "Type AC") risks.push({code:"C3",issue:"RCD type not confirmed or Type AC installed - Type A minimum required for solar PV",regulation:"BS 7671 531.3.3",recommended_action:"Confirm RCD type and replace with Type A or B if required"});
if (ans("inv5") === "no")  risks.push({code:"C3",issue:"No smoke detector at inverter location",regulation:"BS 5839-6 Clause 11.1.1",recommended_action:"Install suitable smoke detection at inverter location"});
if (ans("inv8") === "no" || ans("inv8") === "lim") risks.push({code:"C3",issue:"Inverter clearances not met",regulation:"BS 7671 reg 134.1.1",recommended_action:"Reposition to meet manufacturer minimum clearance requirements"});
if (ans("inv9") === "no" || ans("inv9") === "fi")  risks.push({code:"FI",issue:"Inverter may be on combustible material",regulation:"Manufacturers instructions",recommended_action:"Verify mounting material and remediate if combustible"});
if (ans("iso7") === "no")  risks.push({code:"C2",issue:"AC isolator not correctly installed - IP2x not achieved",regulation:"BS 7671 416.2.1",recommended_action:"Immediately remediate AC isolator installation"});
if (ans("ac4") === "no")   risks.push({code:"C3",issue:"RCD not bidirectional rated",regulation:"BS 7671 531.3.3",recommended_action:"Replace with bidirectional Type A RCD"});
if (ans("ac5") === "no")   risks.push({code:"C3",issue:"No surge protection (SPD) present",regulation:"BS 7671 443",recommended_action:"Assess risk and consider SPD installation"});
if (ans("lab3") === "no")  risks.push({code:"C3",issue:"Dual supply warning labels missing",regulation:"BS 7671 712.514",recommended_action:"Fit dual supply labels at all interconnection points"});
if (ans("lab4") === "no")  risks.push({code:"C3",issue:"No single line wiring diagram on site",regulation:"IET CoP 9.7b",recommended_action:"Produce and display wiring diagram on site"});
if (ans("lab6") === "no")  risks.push({code:"C3",issue:"Emergency shutdown procedure not displayed",regulation:"IET CoP",recommended_action:"Display emergency shutdown procedure at inverter"});
if (ans("sp8") === "no" || ans("sp8") === "lim") risks.push({code:"FI",issue:"Array frame equipotential bonding not confirmed",regulation:"IEC 60364-7-712",recommended_action:"Investigate bonding requirement and install if required"});
if (ans("mec4") === "no")  risks.push({code:"C3",issue:"Cable entry not weatherproof",regulation:"IEC 60364-7-712.522.8.3",recommended_action:"Seal cable entry point to prevent water ingress"});

// - FLAGGED ITEMS -------------
const handled = ["inv5","inv8","inv9","iso7","ac4","ac5","lab3","lab4","lab6","sp8","mec4"];
(flaggedItems||[]).forEach(item => {
if (handled.includes(item.id)) return;
const code = item.risk || (item.answer === "no" ? "C3" : "FI");
risks.push({code, issue:"Failed: "+(item.id||"item")+(item.note?" - "+item.note:""), regulation:"BS 7671", recommended_action:"Inspect and remediate as required"});
});

// - STATUS -----------------------
const c2s = risks.filter(r=>r.code==="C2");
const c3s = risks.filter(r=>r.code==="C3");
const fis = risks.filter(r=>r.code==="FI");
const status = c2s.length>0 ? "Fail" : (risks.length>0||missing.length>0) ? "Advisory" : "Pass";

if (c2s.length>0) actions.push("URGENT: Remediate all C2 items before installation is used");
if (c3s.length>0) actions.push("Schedule remedial works for "+c3s.length+" C3 advisory item(s)");
if (fis.length>0) actions.push("Arrange further investigation for "+fis.length+" FI item(s) without delay");
if (missing.length>0) actions.push("Complete "+missing.length+" missing record(s) - photos, serials, test results");
actions.push("Retain report and make available for next inspection");

const tags = ["solar_pv"];
if (risks.some(r=>r.issue.includes("inverter")||r.issue.includes("Inverter"))) tags.push("inverter");
if (risks.some(r=>r.issue.includes("RCD")||r.issue.includes("rcd"))) tags.push("rcd");
if (risks.some(r=>r.issue.includes("bond")||r.issue.includes("earth"))) tags.push("earthing");
if (risks.some(r=>r.issue.includes("label")||r.issue.includes("Label"))) tags.push("labelling");
if (missing.some(m=>m.includes("photo")||m.includes("Photo"))) tags.push("missing_photos");
if (missing.some(m=>m.includes("serial")||m.includes("Serial"))) tags.push("missing_serials");
if (missing.some(m=>m.includes("not recorded"))) tags.push("incomplete_records");

let summary = "Solar PV inspection completed for "+(job?.client||"this site")+". ";
if (status==="Pass") summary += "Installation found to be in satisfactory condition with no significant issues identified.";
else if (status==="Fail") summary += c2s.length+" potentially dangerous condition(s) require immediate remedial action before the installation can be considered safe for continued use.";
else summary += risks.length+" compliance finding(s) identified: "+c2s.length+" urgent (C2), "+c3s.length+" advisory (C3), "+fis.length+" for further investigation (FI). "+missing.length+" record(s) also incomplete.";

return { overall_status:status, summary, missing_information:missing, risk_items:risks, recommended_actions:actions, next_inspection:c2s.length>0?"Immediate":"12 months", tags };
}

// - ANSWER ROW -----------------------
function AnswerRow({ value, onChange, invert }) {
return (
<div style={{display:"flex",gap:5}}>
{ANSWER_OPTS.map(opt => {
const sel = value === opt.val;
// For inverted items (e.g. "evidence of damage?") No is good (green), Yes is bad (red)
let col = opt.col;
if (invert && opt.val === "no") col = C.green;
else if (invert && opt.val === "yes") col = C.red;
return <button key={opt.val} onClick={()=>onChange(sel?null:opt.val)} style={{flex:1,padding:"8px 0",fontSize:11,fontWeight:700,borderRadius:7,border:`1.5px solid ${sel?col:C.border}`,background:sel?col+"22":"#f8fafc",color:sel?col:C.muted,cursor:"pointer",fontFamily:"inherit",fontWeight:sel?700:600,transition:"all 0.12s"}}>{opt.label}</button>;
})}
</div>
);
}

// - SECTION SCORE ---------------
function SectionScore({ items, answers }) {
const yesno = items.filter(i=>!i.type);
const done  = yesno.filter(i=>answers[i.id]?.answer).length;
const flag  = yesno.filter(i=>{const a=answers[i.id]?.answer; if(i.invert&&a==="no")return false; if(i.invert&&a==="yes")return true; return ["no","lim","fi"].includes(a);}).length;
const pct   = yesno.length>0 ? Math.round(done/yesno.length*100) : 0;
return (
<div style={{display:"flex",gap:6,alignItems:"center"}}>
{flag>0 && <span style={S.tag(C.red)}>{flag} flagged</span>}
<span style={{fontSize:11,color:C.muted}}>{done}/{yesno.length} ({pct}%)</span>
</div>
);
}

// - CHECKLIST SCREEN --------------------
function ChecklistScreen({ job, asset, initialData, onBack, onNext }) {
const [answers, setAnswers] = useState(() => {
  const base = initialData || {};
  // Auto-populate overlapping fields from the asset register (only if not already set)
  if (asset) {
    const prefill = (id, assetVal) => {
      if (assetVal && !base[id]?.value) {
        base[id] = { ...(base[id]||{}), value: assetVal };
      }
    };
    prefill("inv1", asset.inverter_make);
    prefill("inv2", asset.inverter_model);
    prefill("inv3", asset.inverter_serial);
    prefill("inv4", asset.inverter_loc || asset.inverter_location);
    prefill("met1", asset.meter_make);
    prefill("met2", asset.meter_model);
    prefill("met3", asset.meter_serial);
  }
  return base;
});
const [expanded, setExpanded] = useState("panels");
const [stamp, setStamp] = useState(true);
const [engName, setEngName] = useState(job?.engineer||"");

const setAns  = (id,f,v) => setAnswers(a=>({...a,[id]:{...(a[id]||{}),[f]:v}}));
const addPics = (id,pics) => setAnswers(a=>({...a,[id]:{...(a[id]||{}),photos:[...(a[id]?.photos||[]),...pics]}}));
const remPic  = (id,pid)  => setAnswers(a=>({...a,[id]:{...(a[id]||{}),photos:(a[id]?.photos||[]).filter(p=>p.id!==pid)}}));

const totalYN = SECTIONS.reduce((n,s)=>n+s.items.filter(i=>!i.type).length,0);
const done    = Object.values(answers).filter(a=>a.answer).length;
const pct     = Math.round(done/totalYN*100);
const flagged = SECTIONS.reduce((n,s)=>n+s.items.filter(i=>{const a=answers[i.id]?.answer; if(i.invert&&a==="no")return false; if(i.invert&&a==="yes")return true; return ["no","lim","fi"].includes(a);}).length,0);

return (
<div style={{padding:16}}>
{/* Stamp settings */}
<div style={{...S.card,padding:12,marginBottom:14}}>
<div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>📷 PHOTO STAMP SETTINGS</div>
<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:stamp?10:0}}>
<span style={{fontSize:13}}>Geo-stamp & date photos</span>
<button onClick={()=>setStamp(s=>!s)} style={{background:stamp?C.green+"22":"#f8fafc",border:`1.5px solid ${stamp?C.green:C.border}`,borderRadius:20,padding:"4px 14px",color:stamp?C.green:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>{stamp?"ON":"OFF"}</button>
</div>
{stamp && (<div><label style={S.label}>Engineer name on photo</label><input style={S.input} value={engName} onChange={e=>setEngName(e.target.value)} placeholder="e.g. J. Harrison"/></div>)}
</div>

  {/* Progress */}
  <div style={{...S.card,padding:"10px 14px",marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
      <span style={{fontSize:11,color:C.muted}}>PROGRESS</span>
      <div style={{display:"flex",gap:10}}>
        {flagged>0 && <span style={S.tag(C.red)}>{flagged} FLAGGED</span>}
        <span style={{fontSize:11,color:C.green,fontWeight:700}}>{pct}%</span>
      </div>
    </div>
    <div style={{background:"#e2e8f0",borderRadius:4,height:5}}>
      <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${C.green},${C.accent})`,borderRadius:4,transition:"width 0.3s"}}/>
    </div>
  </div>

  {SECTIONS.map(sec => {
    const open = expanded === sec.id;
    return (
      <div key={sec.id} style={{...S.card,padding:0,overflow:"hidden",marginBottom:8}}>
        <div onClick={()=>setExpanded(open?null:sec.id)} style={{padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",background:open?"#f0fdf4":"#ffffff"}}>
          <div style={{fontSize:15,fontWeight:700,color:open?C.green:C.text}}>{sec.label}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <SectionScore items={sec.items} answers={answers}/>
            <span style={{color:C.muted,fontSize:16,width:16,textAlign:"center"}}>{open?"-":"+"}</span>
          </div>
        </div>
        {open && (
          <div style={{borderTop:`1px solid ${C.border}`}}>
            {sec.items.map((item,idx) => {
              const ia = answers[item.id]||{};
              const flagged = item.invert ? (ia.answer==="yes") : ["no","lim","fi"].includes(ia.answer);
              return (
                <div key={item.id} style={{padding:"14px 16px",borderTop:idx>0?`1px solid ${C.border}10`:"none",background:flagged?C.red+"05":"transparent"}}>
                  <div style={{fontSize:14,color:C.text,marginBottom:10,lineHeight:1.55,fontWeight:500}}>{item.q}</div>
                  {!item.type && <AnswerRow value={ia.answer} onChange={v=>setAns(item.id,"answer",v)} invert={item.invert}/>}
                  {item.type==="number" && <input style={S.input} type="number" placeholder="Enter value" value={ia.value||""} onChange={e=>setAns(item.id,"value",e.target.value)}/>}
                  {item.type==="text" && <input style={S.input} placeholder="Enter details" value={ia.value||""} onChange={e=>setAns(item.id,"value",e.target.value)}/>}
                  {item.type==="select" && (
                    <div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:6}}>
                        {item.opts.map(opt=><button key={opt} onClick={()=>setAns(item.id,"value",opt)} style={{background:ia.value===opt?C.blue+"22":"#f8fafc",color:ia.value===opt?C.blue:C.muted,border:`1px solid ${ia.value===opt?C.blue:C.border}`,borderRadius:6,padding:"6px 10px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{opt}</button>)}
                      </div>
                      <input style={{...S.input,marginTop:4}} placeholder="Or type custom..." value={(!item.opts?.includes(ia.value)&&ia.value)||""} onChange={e=>setAns(item.id,"value",e.target.value)}/>
                    </div>
                  )}
                  {flagged && (
                    <div style={{marginTop:10}}>
                      <div style={{display:"flex",gap:6,marginBottom:8}}>
                        {RISK_TAGS.map(rt=><button key={rt.val} onClick={()=>setAns(item.id,"risk",ia.risk===rt.val?null:rt.val)} style={{background:ia.risk===rt.val?rt.col+"22":"#f8fafc",color:ia.risk===rt.val?rt.col:C.muted,border:`1.5px solid ${ia.risk===rt.val?rt.col:C.border}`,borderRadius:6,padding:"5px 10px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{rt.val}</button>)}
                      </div>
                      <textarea style={{...S.input,minHeight:60,resize:"vertical",fontSize:13}} placeholder="Note / observation..." value={ia.note||""} onChange={e=>setAns(item.id,"note",e.target.value)}/>
                    </div>
                  )}
                  <PhotoCapture photos={ia.photos||[]} onAdd={p=>addPics(item.id,p)} onRemove={pid=>remPic(item.id,pid)} engineerName={engName} stampEnabled={stamp}/>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  })}
  <div style={{marginTop:8}}>
    <button style={S.btn("primary")} onClick={()=>onNext(answers)}>Test Results -></button>
    <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
  </div>
</div>

);
}

// - LOGIN --------------------------
function LoginScreen({ onLogin }) {
const [email,    setEmail]    = useState("");
const [pass,     setPass]     = useState("");
const [loading,  setLoading]  = useState(false);
const [error,    setError]    = useState(null);
const [mode,     setMode]     = useState("login"); // login | signup
const [name,     setName]     = useState("");
const [role,     setRole]     = useState("engineer");

const handleLogin = async () => {
if (!email || !pass) { setError("Enter email and password"); return; }
setLoading(true); setError(null);
try {
let data;
try {
data = await sb.signIn(email, pass);
} catch(fetchErr) {
throw new Error("Network error - check your connection: " + fetchErr.message);
}
if (!data) throw new Error("No response from server");
if (data.error) {
const msg = data.error.message || data.error.error_description || JSON.stringify(data.error);
throw new Error(msg);
}
if (!data.access_token) {
throw new Error("No token returned - check your email is confirmed in Supabase");
}
onLogin({
email,
name: data.user?.user_metadata?.full_name || email.split("@")[0],
role: data.user?.user_metadata?.role || "engineer",
token: data.access_token,
refreshToken: data.refresh_token,
id: data.user?.id,
});
} catch(e) {
setError(e.message);
}
setLoading(false);
};

const handleSignUp = async () => {
if (!email || !pass || !name) { setError("Fill in all fields"); return; }
if (pass.length < 6) { setError("Password must be at least 6 characters"); return; }
setLoading(true); setError(null);
try {
const data = await sb.signUp(email, pass, name, role);
if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

  // If email confirmation is disabled, access_token comes back immediately
  if (data.access_token) {
    onLogin({
      email,
      name: data.user?.user_metadata?.full_name || name,
      role: data.user?.user_metadata?.role || role,
      token: data.access_token,
      id: data.user?.id,
    });
    return;
  }

  // Email confirmation required
  setMode("login");
  setError("✓ Account created - check your email to confirm, then sign in");
} catch(e) {
  setError(e.message);
}
setLoading(false);

};

return (
<div style={{padding:28,paddingTop:60}}>
<div style={{textAlign:"center",marginBottom:36}}>
<div style={{fontSize:44,marginBottom:10,filter:`drop-shadow(0 0 20px ${C.green}66)`}}>⚡</div>
<div style={{fontSize:28,fontWeight:700,color:"#1e3a5f",letterSpacing:"0.08em"}}>THEMIS</div>
<div style={{fontSize:11,color:C.muted,letterSpacing:"0.25em",marginTop:2}}>DIAGNOSTICS</div>
<div style={{width:40,height:2,background:"#059669",margin:"12px auto 0",borderRadius:2}}/>
</div>

  <div style={{display:"flex",gap:8,marginBottom:16}}>
    {["login","signup"].map(m=>(
      <button key={m} onClick={()=>{setMode(m);setError(null);}} style={{flex:1,padding:"10px",background:mode===m?"#1e3a5f":"transparent",border:`1px solid ${mode===m?"#1e3a5f":C.border}`,color:mode===m?"#ffffff":C.muted,borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
        {m==="login"?"Sign In":"Create Account"}
      </button>
    ))}
  </div>

  <div style={S.card}>
    {mode==="signup" && (
      <>
        <div style={{marginBottom:12}}><label style={S.label}>Full Name</label><input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. J. Harrison"/></div>
        <div style={{marginBottom:12}}>
          <label style={S.label}>Role</label>
          <div style={{display:"flex",gap:6}}>
            {["engineer","qs","admin"].map(r=>(
              <button key={r} onClick={()=>setRole(r)} style={{flex:1,padding:"8px",background:role===r?C.blue+"22":"#f8fafc",border:`1px solid ${role===r?C.blue:C.border}`,color:role===r?C.blue:C.muted,borderRadius:7,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </>
    )}
    <div style={{marginBottom:12}}><label style={S.label}>Email</label><input style={S.input} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="engineer@company.co.uk"/></div>
    <div style={{marginBottom:16}}><label style={S.label}>Password</label><input style={S.input} type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="--------"/></div>
    {error && <div style={{fontSize:12,color:error.includes("created")?C.green:C.red,marginBottom:12,lineHeight:1.5}}>{error}</div>}
    <button style={S.btn("primary")} onClick={mode==="login"?handleLogin:handleSignUp} disabled={loading}>
      {loading?"⏳ Please wait...":(mode==="login"?"Sign In ->":"Create Account ->")}
    </button>
  </div>
  <div style={{textAlign:"center",fontSize:11,color:C.muted,marginTop:12}}>
    Secured by Supabase Auth
  </div>
</div>

);
}

// - DASHBOARD ----------------
// - DEMO DATA ----------------
const DEMO_ASSET = {
panel_count:"4", panel_make:"Sanyo", panel_model:"HIT-200BA3",
inverter_make:"SMA", inverter_model:"Sunny Boy SB1200", inverter_serial:"2001652401",
system_age:"10", meter_make:"Landis + Gyr", meter_serial:"A471077465",
meter_reading:"005065.1", inverter_loc:"Loft", dc_iso_loc:"Adjacent to inverter",
ac_iso_loc:"Electrical intake area",
inverterSpecs:{
_make:"SMA", _model:"Sunny Boy SB1200",
rated_power_w:1200, max_dc_voltage_v:200, rated_voc_v:120, rated_isc_a:10,
mppt_range_v:"15-120V", ac_output_v:230, max_ac_current_a:5.7,
efficiency_pct:93, ip_rating:"IP54",
min_clearance_top_mm:400, min_clearance_sides_mm:200, min_clearance_bottom_mm:200,
mounting_surface:"Non-combustible - metal, masonry or concrete only",
operating_temp_min_c:-25, operating_temp_max_c:60,
protection_class:"Class I", weight_kg:14,
key_notes:"Must not be mounted on wood or combustible materials. Requires ventilation clearance to prevent derating. ESS (Electronic Solar Switch) must be inserted before operation."
},
panelSpecs:null,
};

const DEMO_CHECKLIST = {
sp1:{value:"South"},
sp2:{value:"4"},
sp3:{value:"Front"},
sp4:{answer:"no",  note:"No damage to solar panels", photos:[]},
sp5:{answer:"yes", note:"Panels are clear and clean of debris however there is evidence of moss growing on roof tiles which could eventually grow onto panels", photos:[]},
sp6:{answer:"lim", note:"Panel make could not be clearly identified from ground level", photos:[]},
sp7:{answer:"lim", note:"Cables not fully visible from accessible areas", photos:[]},
sp8:{answer:"lim", risk:"FI", note:"There is no evidence of equipotential bonding to prevent the accumulation of electrostatic charge", photos:[]},
sp9:{answer:"no",  note:"No evidence of bird or pest damage", photos:[]},
sp10:{answer:"yes",note:"Junction boxes appear secure", photos:[]},
inv1:{value:"SMA"},
inv2:{value:"Sunny Boy SB1200"},
inv3:{value:"2001652401"},
inv4:{value:"Loft"},
inv5:{answer:"no", risk:"C3", note:"No smoke detector present at inverter location in loft", photos:[]},
inv6:{answer:"yes",note:"Inverter functioning correctly, green LED active", photos:[]},
inv7:{answer:"yes",note:"Inverter clear of debris", photos:[]},
inv8:{answer:"no", risk:"C3", note:"Inverter does not have the correct recommended clearances - positioned too close to wall", photos:[]},
inv9:{answer:"fi", risk:"FI", note:"Inverter mounted on combustible materials - appears to be wood. Further investigation required (manufacturers instructions)", photos:[]},
inv10:{answer:"yes",note:"Inverter secured and free from vibration", photos:[]},
inv11:{answer:"yes",note:"Panel is in good working order", photos:[]},
iso1:{answer:"yes",note:"DC disconnector installed however it is not within the clearances of the manufacturers instructions", photos:[]},
iso2:{answer:"yes",note:"DC isolator correctly labelled", photos:[]},
iso3:{answer:"yes",note:"DC isolator in good working condition", photos:[]},
iso4:{answer:"yes",note:"AC isolator located and correctly labelled", photos:[]},
iso5:{answer:"yes",note:"AC isolator correctly labelled", photos:[]},
iso6:{answer:"yes",note:"AC isolator in good working condition", photos:[]},
iso7:{answer:"no", risk:"C2", note:"AC isolator not correctly installed, therefore not meeting minimum IP2x (416.2.1)", photos:[]},
iso8:{answer:"yes",note:"AC isolator local to distribution equipment", photos:[]},
ac1:{answer:"yes", note:"Installation protected by RCD", photos:[]},
ac2:{value:"61008"},
ac3:{value:"Type AC"},
ac4:{answer:"no", risk:"C3", note:"Type AC RCD in place - needs to be Type A as per BS 7671 531.3.3", photos:[]},
ac5:{answer:"no", risk:"C3", note:"No surge protection present", photos:[]},
ac6:{answer:"lim",risk:"FI", note:"Array framework equipotential bonding - limited, unable to fully verify", photos:[]},
lab1:{answer:"yes",note:"Circuit protector devices labelled", photos:[]},
lab2:{answer:"yes",note:"Main AC isolator labelled - PV System Main AC Isolator", photos:[]},
lab3:{answer:"no", risk:"C3", note:"No dual supply warning labels present at inverter side of installation (712.514)", photos:[]},
lab4:{answer:"no", risk:"C3", note:"No wiring diagram present on site (9.7b IET code of practice)", photos:[]},
lab5:{answer:"lim",note:"Installer details partially visible", photos:[]},
lab6:{answer:"no", risk:"C3", note:"Emergency shutdown procedures not displayed", photos:[]},
lab7:{answer:"yes",note:"DC junction box warning labels present", photos:[]},
met1:{value:"Landis + Gyr"},
met2:{value:"5235B"},
met3:{value:"A471077465"},
met4:{value:"005065"},
met5:{answer:"yes",note:"Meter accessible and readable", photos:[]},
met6:{answer:"yes",note:"Meter correctly labelled", photos:[]},
mec1:{answer:"yes",note:"Ventilation provided", photos:[]},
mec2:{answer:"yes",note:"Frame appears corrosion proof", photos:[]},
mec3:{answer:"yes",note:"Array frame correctly fixed and stable", photos:[]},
mec4:{answer:"lim",note:"Could not inspect the cable outlet to the roof tile as this was inaccessible", photos:[]},
};

const DEMO_TEST_RESULTS = {
voc:"113", isc:"7.45", irradiance:"249.1",
ir_pos:"200", ir_neg:"200",
polarity:"satisfactory", zs:"0.60",
rcd_type:"Type AC", rcd_trip:"29",
mcb_rating:"16", breaking_cap:"6",
switchgear:"satisfactory", inverter_ok:"satisfactory", loss_mains:"satisfactory",
};

const DEMO_JOB = {
id:2, client:"Bolton at Home",
address:"1 Back Alice Street, Little Lever, Bolton, BL3 1FX",
jobNumber:"TH-2024-002", mode:"inspection",
status:"completed", date:"2024-08-01",
engineer:"L. McKenna", flagged:true,
};

const MOCK_JOBS = [
DEMO_JOB,
{id:1,client:"Sunrise Solar Ltd",address:"14 Park Lane, Bristol",jobNumber:"TH-2024-001",mode:"inspection",status:"open",date:"2024-01-15",engineer:"J. Harrison",flagged:false},
{id:3,client:"EcoHomes UK",address:"7 Bluebell Close, Bristol",jobNumber:"TH-2024-003",mode:"diagnostic",status:"open",date:"2024-01-16",engineer:"J. Harrison",flagged:false},
];

function Dashboard({ user, onCreateJob, onSelectJob }) {
const [jobs,    setJobs]    = useState([]);
const [loading, setLoading] = useState(true);
const [error,   setError]   = useState(null);
const modeCol = {inspection:C.blue,service:C.green,diagnostic:C.amber,commissioning:C.accent};

useEffect(() => {
loadJobs();
}, []);

const loadJobs = async () => {
setLoading(true);
try {
const data = await sb.query("jobs", user.token, {
select: "*",
order: "created_at.desc",
limit: 50,
});
if (Array.isArray(data)) {
setJobs(data);
} else {
// Not an error - just no jobs yet
setJobs([]);
}
} catch(e) {
console.error("Load jobs error:", e);
setJobs([]);
}
setLoading(false);
};

return (
<div style={{padding:16}}>
<div style={{background:"#1e3a5f",borderRadius:10,padding:16,marginBottom:16}}>
<div>
<div style={{fontSize:11,color:C.muted,marginBottom:3}}>Signed in as</div>
<div style={{fontSize:20,fontWeight:700,color:C.green}}>{user.name||user.email?.split("@")[0]||"Engineer"}</div>
<div style={{fontSize:11,color:C.blue,marginTop:3,letterSpacing:"0.06em"}}>{(user.role||"engineer").toUpperCase()} . THEMIS DIAGNOSTICS</div>
</div>

  </div>
  {loading && <div style={{...S.card,textAlign:"center",padding:20,color:C.muted}}>Loading jobs...</div>}
  {error && <div style={{...S.card,color:C.red,fontSize:13}}>{error}</div>}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
    {[[jobs.filter(j=>j.status==="open"||j.status==="in_progress").length,"Open",C.blue],[jobs.filter(j=>j.status==="completed").length,"Done",C.green],[jobs.filter(j=>j.flagged).length,"Flagged",C.red]].map(([n,l,col])=>(
      <div key={l} style={{background:"#ffffff",border:`1px solid ${col}33`,borderRadius:10,padding:"14px 8px",textAlign:"center",boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:28,fontWeight:800,color:col,lineHeight:1}}>{n}</div>
        <div style={{fontSize:11,color:C.muted,marginTop:4,letterSpacing:"0.06em"}}>{l}</div>
      </div>
    ))}
  </div>
  <button style={S.btn("primary")} onClick={onCreateJob}>+ New Job</button>
  <div style={S.secTitle}>> Jobs</div>
  {jobs.map(j=>(
    <div key={j.id} style={{...S.card,cursor:"pointer",borderLeft:`3px solid ${j.status==="completed"?C.green:j.flagged?C.red:C.blue}`}} onClick={()=>onSelectJob(j)}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div style={{fontSize:15,fontWeight:700,color:C.text}}>{j.client||"Unnamed Job"}</div>
        <div style={{display:"flex",gap:5,flexShrink:0,marginLeft:8}}>
          {j.flagged && <span style={S.tag(C.red)}>⚑</span>}
          <span style={S.tag(j.status==="completed"?C.green:j.status==="flagged"?C.red:C.blue)}>{(j.status||"open").toUpperCase()}</span>
        </div>
      </div>
      <div style={{fontSize:12,color:C.muted,marginBottom:8}}>{j.address||"No address"}</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={S.tag(modeCol[j.mode]||C.muted)}>{(j.mode||"inspection").toUpperCase()}</span>
        <span style={{fontSize:11,color:C.muted}}>{j.job_number||j.jobNumber||""}</span>
      </div>
    </div>
  ))}
</div>

);
}

// - CREATE JOB ----------------
const DEFAULT_LIMITATIONS = [
  "No roof access obtained — array not physically inspected",
  "Concealed DC cabling not inspected",
  "Loft hatch locked — inverter not physically accessible",
  "Generation meter not accessible",
  "Distribution board not accessible",
  "Occupier not present — limited access to property",
  "Adverse weather conditions — roof inspection not carried out",
  "System not generating at time of inspection",
  "Inverter display faulty — operational data unavailable",
  "Original installation documentation not available",
  "DC isolator inaccessible",
  "AC isolator inaccessible",
];

function CreateJobScreen({ onBack, onCreate }) {
const generateJobNumber = () => {
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth()+1).padStart(2,"0");
const day = String(now.getDate()).padStart(2,"0");
const rand = String(Math.floor(Math.random()*9000)+1000);
return `TH-${year}${month}${day}-${rand}`;
};
const [form, setForm] = useState({client:"",address:"",jobNumber:generateJobNumber(),engineer:"",date:new Date().toISOString().split("T")[0],mode:"inspection",limitations:[]});
const [customLim, setCustomLim] = useState("");
const set = (k,v) => setForm(f=>({...f,[k]:v}));

const toggleLim = (lim) => setForm(f=>({
  ...f,
  limitations: f.limitations.includes(lim)
    ? f.limitations.filter(l=>l!==lim)
    : [...f.limitations, lim]
}));

const addCustom = () => {
  if(!customLim.trim()) return;
  setForm(f=>({...f, limitations:[...f.limitations, customLim.trim()]}));
  setCustomLim("");
};

return (
<div style={{padding:16}}>
<div style={S.secTitle}>* New Job</div>
{[["client","Client Name"],["address","Site Address"],["jobNumber","Job Number"],["engineer","Engineer"]].map(([k,l])=>(
<div key={k} style={{marginBottom:12}}><label style={S.label}>{l}</label><input style={S.input} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={l}/></div>
))}
<div style={{marginBottom:12}}><label style={S.label}>Date</label><input style={S.input} type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
<div style={{marginBottom:14}}>
<label style={S.label}>Mode</label>
<div style={{display:"flex",flexWrap:"wrap",gap:6}}>
{[["inspection","Inspection"],["service","Service"],["commissioning","Commission"],["diagnostic","Diagnostic"],["eicr","EICR"]].map(([v,l])=>(
<button key={v} onClick={()=>set("mode",v)} style={{...S.btn(form.mode===v?"primary":"ghost"),marginBottom:0,padding:"10px 14px",fontSize:13,flex:"1 0 calc(50% - 3px)"}}>{l}</button>
))}
</div>
</div>

<div style={{marginBottom:18}}>
<label style={S.label}>Limitations / Exclusions</label>
<div style={{marginBottom:8}}>
{DEFAULT_LIMITATIONS.map(lim=>{
  const ticked = form.limitations.includes(lim);
  return (
    <button key={lim} onClick={()=>toggleLim(lim)} style={{display:"flex",alignItems:"flex-start",gap:10,width:"100%",background:ticked?"#f0f9ff":"#f8fafc",border:"1.5px solid",borderColor:ticked?"#1e3a5f":"#e2e8f0",borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>
      <span style={{fontSize:16,color:ticked?"#1e3a5f":"#cbd5e1",flexShrink:0,marginTop:1}}>{ticked?"☑":"☐"}</span>
      <span style={{fontSize:13,color:ticked?"#1e3a5f":"#64748b",lineHeight:1.4}}>{lim}</span>
    </button>
  );
})}
</div>
{form.limitations.filter(l=>!DEFAULT_LIMITATIONS.includes(l)).map(lim=>(
  <div key={lim} style={{display:"flex",alignItems:"center",gap:8,background:"#f0f9ff",border:"1.5px solid #1e3a5f",borderRadius:8,padding:"8px 12px",marginBottom:6}}>
    <span style={{fontSize:16,color:"#1e3a5f"}}>☑</span>
    <span style={{fontSize:13,color:"#1e3a5f",flex:1}}>{lim}</span>
    <button onClick={()=>setForm(f=>({...f,limitations:f.limitations.filter(l=>l!==lim)}))} style={{background:"none",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:16,padding:0}}>×</button>
  </div>
))}
<div style={{display:"flex",gap:8,marginTop:6}}>
  <input style={{...S.input,flex:1,marginBottom:0}} placeholder="Add custom limitation..." value={customLim} onChange={e=>setCustomLim(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCustom()}/>
  <button onClick={addCustom} style={{padding:"12px 16px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:10,fontSize:13,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Add</button>
</div>
</div>

<button style={S.btn("primary")} onClick={()=>onCreate({...form,id:Date.now(),status:"open",flagged:false,limitations:form.limitations.join(". ")})}>Create Job -></button>
<button style={S.btn("ghost")} onClick={onBack}>Cancel</button>
</div>
);
}

// - SPEC LOOKUP ENGINE -------------------
function buildSpecPrompt(make, model, type) {
return [
"You are a solar PV technical database. Look up the exact manufacturer specifications for this " + type + ".",
"Make: " + make + " Model: " + model,
"Return ONLY a JSON object with these fields (use null for unknown):",
type === "inverter"
? JSON.stringify({
rated_power_w: null,
max_dc_voltage_v: null,
rated_voc_v: null,
rated_isc_a: null,
mppt_range_v: null,
ac_output_v: null,
max_ac_current_a: null,
efficiency_pct: null,
ip_rating: null,
min_clearance_top_mm: null,
min_clearance_sides_mm: null,
min_clearance_bottom_mm: null,
mounting_surface: null,
operating_temp_min_c: null,
operating_temp_max_c: null,
protection_class: null,
weight_kg: null,
key_notes: null
})
: JSON.stringify({
rated_power_w: null,
voc_v: null,
vmp_v: null,
isc_a: null,
imp_a: null,
max_system_voltage_v: null,
cell_type: null,
dimensions_mm: null,
weight_kg: null,
temp_coeff_voc: null,
temp_coeff_pmax: null,
efficiency_pct: null,
frame_material: null,
ip_rating: null,
key_notes: null
})
].join(" ");
}

// - ASSET SCREEN ---------------
function AssetScreen({ job, initialData, onBack, onNext }) {
const [a, setA] = useState(initialData || {
panel_count:"", panel_make:"", panel_model:"",
inverter_make:"", inverter_model:"", inverter_serial:"",
system_age:"", meter_make:"", meter_serial:"", meter_reading:"",
inverter_loc:"", dc_iso_loc:"", ac_iso_loc:""
});
const [inverterSpecs, setInverterSpecs] = useState(initialData?.inverterSpecs || null);
const [panelSpecs,    setPanelSpecs]    = useState(initialData?.panelSpecs || null);
const [lookingUp,     setLookingUp]     = useState(null); // "inverter"|"panel"|null
const [lookupError,   setLookupError]   = useState(null);

const set = (k,v) => setA(x=>({...x,[k]:v}));

const lookupSpecs = (type) => {
const make  = type==="inverter" ? a.inverter_make  : a.panel_make;
const model = type==="inverter" ? a.inverter_model : a.panel_model;
if (!make || !model) { setLookupError("Enter make and model first"); return; }
setLookingUp(type);
setLookupError(null);

// Use local knowledge base for common inverters/panels
// In production this would hit a backend API
setTimeout(() => {
  try {
    const key = (make + " " + model).toLowerCase();
    let specs = null;

    // -- INVERTER DATABASE ---------------------------------
    if (type === "inverter") {
      if (key.includes("sunny boy") && (key.includes("sb1200") || key.includes("sb 1200"))) {
        specs = { rated_power_w:1200, max_dc_voltage_v:200, rated_voc_v:120, rated_isc_a:10, mppt_range_v:"15-120V", ac_output_v:230, max_ac_current_a:5.7, efficiency_pct:93, ip_rating:"IP54", min_clearance_top_mm:400, min_clearance_sides_mm:200, min_clearance_bottom_mm:200, mounting_surface:"Non-combustible - metal, masonry or concrete only", operating_temp_min_c:-25, operating_temp_max_c:60, protection_class:"Class I", weight_kg:14, key_notes:"Must not be mounted on wood or combustible materials. Requires ventilation clearance to prevent derating. ESS (Electronic Solar Switch) must be inserted before operation." };
      } else if (key.includes("se5000") || key.includes("solaredge") && key.includes("5000")) {
        specs = { rated_power_w:5000, max_dc_voltage_v:480, rated_voc_v:400, rated_isc_a:15, mppt_range_v:"100-480V", ac_output_v:230, max_ac_current_a:21.7, efficiency_pct:97.6, ip_rating:"IP65", min_clearance_top_mm:300, min_clearance_sides_mm:100, min_clearance_bottom_mm:400, mounting_surface:"Any solid surface - IP65 rated for outdoor use", operating_temp_min_c:-40, operating_temp_max_c:60, protection_class:"Class I", weight_kg:10.5, key_notes:"Requires SafeDC module-level shutdown. HD-Wave technology. Can be installed outdoors. Requires SolarEdge optimisers on each panel." };
      } else if (key.includes("fronius") && key.includes("symo")) {
        specs = { rated_power_w:5000, max_dc_voltage_v:1000, rated_voc_v:800, rated_isc_a:18, mppt_range_v:"150-800V", ac_output_v:230, max_ac_current_a:21.7, efficiency_pct:98.1, ip_rating:"IP55", min_clearance_top_mm:300, min_clearance_sides_mm:200, min_clearance_bottom_mm:300, mounting_surface:"Non-combustible surface recommended", operating_temp_min_c:-25, operating_temp_max_c:55, protection_class:"Class I", weight_kg:21.5, key_notes:"Dynamic Peak Manager for shading. SuperFlex Design for versatile stringing. Night mode for parasitic loss reduction." };
      } else if (key.includes("solis") || key.includes("ginlong")) {
        specs = { rated_power_w:4000, max_dc_voltage_v:600, rated_voc_v:500, rated_isc_a:12, mppt_range_v:"90-500V", ac_output_v:230, max_ac_current_a:18.2, efficiency_pct:97.7, ip_rating:"IP65", min_clearance_top_mm:300, min_clearance_sides_mm:150, min_clearance_bottom_mm:300, mounting_surface:"Solid wall or bracket - outdoor rated IP65", operating_temp_min_c:-25, operating_temp_max_c:60, protection_class:"Class I", weight_kg:14, key_notes:"Natural cooling - no fans. Wide MPPT voltage range suitable for varied string configurations." };
      } else if (key.includes("growatt")) {
        specs = { rated_power_w:5000, max_dc_voltage_v:550, rated_voc_v:450, rated_isc_a:12.5, mppt_range_v:"90-450V", ac_output_v:230, max_ac_current_a:22, efficiency_pct:97.6, ip_rating:"IP65", min_clearance_top_mm:300, min_clearance_sides_mm:200, min_clearance_bottom_mm:300, mounting_surface:"Outdoor rated - any solid surface", operating_temp_min_c:-25, operating_temp_max_c:60, protection_class:"Class I", weight_kg:12, key_notes:"Dual MPPT tracker. Remote monitoring via ShinePhone app." };
      } else if (key.includes("sungrow")) {
        specs = { rated_power_w:5000, max_dc_voltage_v:1100, rated_voc_v:900, rated_isc_a:15, mppt_range_v:"160-850V", ac_output_v:230, max_ac_current_a:21.7, efficiency_pct:98.4, ip_rating:"IP65", min_clearance_top_mm:300, min_clearance_sides_mm:100, min_clearance_bottom_mm:400, mounting_surface:"Outdoor rated - wall or ground mount", operating_temp_min_c:-25, operating_temp_max_c:60, protection_class:"Class I", weight_kg:14, key_notes:"Built-in DC switch. Smart IV curve diagnosis. Compatible with lithium battery storage." };
      } else if (key.includes("enphase")) {
        specs = { rated_power_w:366, max_dc_voltage_v:60, rated_voc_v:48, rated_isc_a:10, mppt_range_v:"25-48V", ac_output_v:230, max_ac_current_a:1.59, efficiency_pct:97, ip_rating:"IP67", min_clearance_top_mm:0, min_clearance_sides_mm:0, min_clearance_bottom_mm:0, mounting_surface:"Panel-mounted - IP67 outdoor rated", operating_temp_min_c:-40, operating_temp_max_c:65, protection_class:"Class II", weight_kg:1.08, key_notes:"Microinverter - mounts under each panel. No high-voltage DC. Each panel operates independently." };
      } else {
        // Generic lookup by wattage in model name
        const watts = key.match(/(\d{3,5})\s*w?/);
        const w = watts ? parseInt(watts[1]) : 3600;
        specs = {
          rated_power_w: w > 100 ? w : w * 1000,
          max_dc_voltage_v: 600,
          rated_voc_v: null,
          rated_isc_a: null,
          mppt_range_v: "100-550V (typical)",
          ac_output_v: 230,
          max_ac_current_a: null,
          efficiency_pct: 97,
          ip_rating: "IP65 (verify with datasheet)",
          min_clearance_top_mm: 300,
          min_clearance_sides_mm: 200,
          min_clearance_bottom_mm: 300,
          mounting_surface: "Non-combustible surface - verify with manufacturer",
          operating_temp_min_c: -25,
          operating_temp_max_c: 60,
          protection_class: "Class I (verify)",
          weight_kg: null,
          key_notes: "Specifications estimated from model name - verify all values against official datasheet for " + make + " " + model + ". Download from manufacturer website."
        };
      }
    }

    // -- PANEL DATABASE ------------------------------------
    if (type === "panel") {
      if (key.includes("ja solar") || key.includes("jasolar") || key.includes("jam")) {
        specs = { rated_power_w:400, voc_v:49.2, vmp_v:41.8, isc_a:10.2, imp_a:9.57, max_system_voltage_v:1500, cell_type:"Mono PERC", dimensions_mm:"1722 x 1134 x 30mm", weight_kg:21.3, temp_coeff_voc:"-0.28%/degC", temp_coeff_pmax:"-0.35%/degC", efficiency_pct:20.7, frame_material:"Anodised aluminium", ip_rating:"IP68 junction box", key_notes:"MBB half-cell technology. 25-year linear power warranty. PID resistant." };
      } else if (key.includes("longi") || key.includes("hi-mo")) {
        specs = { rated_power_w:405, voc_v:49.8, vmp_v:42.0, isc_a:10.15, imp_a:9.65, max_system_voltage_v:1500, cell_type:"Mono PERC", dimensions_mm:"1724 x 1134 x 30mm", weight_kg:21.3, temp_coeff_voc:"-0.27%/degC", temp_coeff_pmax:"-0.34%/degC", efficiency_pct:20.9, frame_material:"Anodised aluminium", ip_rating:"IP68 junction box", key_notes:"HIMO series. Industry leading low light performance. 25 year product warranty." };
      } else if (key.includes("sunpower")) {
        specs = { rated_power_w:400, voc_v:52.7, vmp_v:43.8, isc_a:9.67, imp_a:9.13, max_system_voltage_v:1000, cell_type:"Maxeon monocrystalline", dimensions_mm:"1690 x 1046 x 40mm", weight_kg:19, temp_coeff_voc:"-0.27%/degC", temp_coeff_pmax:"-0.29%/degC", efficiency_pct:22.8, frame_material:"Anodised aluminium", ip_rating:"IP68 junction box", key_notes:"Maxeon cell technology - industry highest efficiency. 40-year panel life expectancy. No LID or PID." };
      } else if (key.includes("canadian solar") || key.includes("cs3")) {
        specs = { rated_power_w:390, voc_v:49.0, vmp_v:41.4, isc_a:9.98, imp_a:9.42, max_system_voltage_v:1500, cell_type:"Mono PERC", dimensions_mm:"1722 x 1134 x 30mm", weight_kg:21, temp_coeff_voc:"-0.28%/degC", temp_coeff_pmax:"-0.35%/degC", efficiency_pct:20.1, frame_material:"Anodised aluminium", ip_rating:"IP68 junction box", key_notes:"HiKu series. Certified to IEC 61215 / IEC 61730." };
      } else if (key.includes("rec")) {
        specs = { rated_power_w:405, voc_v:49.9, vmp_v:42.3, isc_a:10.14, imp_a:9.57, max_system_voltage_v:1500, cell_type:"Mono half-cut", dimensions_mm:"1730 x 1016 x 30mm", weight_kg:20.2, temp_coeff_voc:"-0.25%/degC", temp_coeff_pmax:"-0.26%/degC", efficiency_pct:21.7, frame_material:"Anodised aluminium", ip_rating:"IP68 junction box", key_notes:"TwinPeak series. Low degradation - 0.25%/yr. 25 year product and performance warranty." };
      } else {
        // Generic panel from wattage
        const watts = key.match(/(\d{2,3})\s*w?p?/);
        const w = watts ? parseInt(watts[1]) : 300;
        const wp = w < 100 ? w * 10 : w;
        specs = {
          rated_power_w: wp,
          voc_v: null,
          vmp_v: null,
          isc_a: null,
          imp_a: null,
          max_system_voltage_v: 1000,
          cell_type: "Monocrystalline (verify)",
          dimensions_mm: "Verify with datasheet",
          weight_kg: null,
          temp_coeff_voc: "Typically -0.28%/degC (verify)",
          temp_coeff_pmax: "Typically -0.35%/degC (verify)",
          efficiency_pct: null,
          frame_material: "Anodised aluminium (verify)",
          ip_rating: "IP67/68 junction box (verify)",
          key_notes: "Specifications estimated - verify all values against official datasheet for " + make + " " + model + ". Download from manufacturer website or request from supplier."
        };
      }
    }

    if (specs) {
      specs._make  = make;
      specs._model = model;
      if (type==="inverter") setInverterSpecs(specs);
      else setPanelSpecs(specs);
    } else {
      setLookupError("Model not found in database");
    }
  } catch(e) {
    setLookupError("Lookup failed: " + e.message);
  }
  setLookingUp(null);
}, 600);

};

const specCard = (specs, type) => {
if (!specs) return null;
const col = type==="inverter" ? C.blue : C.green;
const rows = type==="inverter"
? [
["Rated Power",      specs.rated_power_w ? specs.rated_power_w+"W" : null],
["Max DC Voltage",   specs.max_dc_voltage_v ? specs.max_dc_voltage_v+"V" : null],
["Rated Voc",        specs.rated_voc_v ? specs.rated_voc_v+"V" : null],
["Rated Isc",        specs.rated_isc_a ? specs.rated_isc_a+"A" : null],
["MPPT Range",       specs.mppt_range_v || null],
["AC Output",        specs.ac_output_v ? specs.ac_output_v+"V" : null],
["Efficiency",       specs.efficiency_pct ? specs.efficiency_pct+"%" : null],
["IP Rating",        specs.ip_rating || null],
["Clearance Top",    specs.min_clearance_top_mm ? specs.min_clearance_top_mm+"mm" : null],
["Clearance Sides",  specs.min_clearance_sides_mm ? specs.min_clearance_sides_mm+"mm" : null],
["Clearance Bottom", specs.min_clearance_bottom_mm ? specs.min_clearance_bottom_mm+"mm" : null],
["Mounting Surface", specs.mounting_surface || null],
["Op. Temp Range",   specs.operating_temp_min_c != null ? specs.operating_temp_min_c+"degC to "+specs.operating_temp_max_c+"degC" : null],
["Protection Class", specs.protection_class || null],
["Weight",           specs.weight_kg ? specs.weight_kg+"kg" : null],
]
: [
["Rated Power",      specs.rated_power_w ? specs.rated_power_w+"Wp" : null],
["Voc",              specs.voc_v ? specs.voc_v+"V" : null],
["Vmp",              specs.vmp_v ? specs.vmp_v+"V" : null],
["Isc",              specs.isc_a ? specs.isc_a+"A" : null],
["Imp",              specs.imp_a ? specs.imp_a+"A" : null],
["Max System V",     specs.max_system_voltage_v ? specs.max_system_voltage_v+"V" : null],
["Cell Type",        specs.cell_type || null],
["Efficiency",       specs.efficiency_pct ? specs.efficiency_pct+"%" : null],
["Dimensions",       specs.dimensions_mm || null],
["Weight",           specs.weight_kg ? specs.weight_kg+"kg" : null],
["Temp Coeff Voc",   specs.temp_coeff_voc || null],
["IP Rating",        specs.ip_rating || null],
];

return (
  <div style={{...S.card, border:`1px solid ${col}33`, padding:12, marginTop:10}}>
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
      <div style={{fontSize:12, color:col, fontWeight:700, letterSpacing:"0.08em"}}>
        ✓ {type.toUpperCase()} SPECS LOADED
      </div>
      <span style={S.tag(col)}>{specs._make} {specs._model}</span>
    </div>
    {rows.filter(([,v])=>v!=null).map(([label,value])=>(
      <div key={label} style={{display:"flex", justifyContent:"space-between", borderTop:`1px solid ${C.border}20`, paddingTop:6, marginTop:6}}>
        <span style={{fontSize:12, color:C.muted}}>{label}</span>
        <span style={{fontSize:12, color:C.text, fontWeight:600}}>{value}</span>
      </div>
    ))}
    {specs.key_notes && (
      <div style={{marginTop:10, padding:8, background:C.amber+"11", borderRadius:6, border:`1px solid ${C.amber}22`}}>
        <div style={{fontSize:11, color:C.amber, fontWeight:700, marginBottom:4}}>MANUFACTURER NOTES</div>
        <div style={{fontSize:11, color:C.dim, lineHeight:1.5}}>{specs.key_notes}</div>
      </div>
    )}
  </div>
);

};

const fields = [
["panel_count","Panel Count","number"],["panel_make","Panel Make","text"],["panel_model","Panel Model","text"],
["inverter_make","Inverter Make","text"],["inverter_model","Inverter Model","text"],["inverter_serial","Inverter Serial No.","text"],
["system_age","System Age (years)","number"],["meter_make","Meter Make","text"],["meter_serial","Meter Serial No.","text"],
["meter_reading","Current Meter Reading","number"],["inverter_loc","Inverter Location","text"],
["dc_iso_loc","DC Isolator Location","text"],["ac_iso_loc","AC Isolator Location","text"],
];

return (
<div style={{padding:16}}>
<div style={S.secTitle}>* Asset Details</div>
<div style={{...S.card, marginBottom:14, padding:12, border:`1px solid ${C.blue}22`}}>
<div style={{fontSize:13, fontWeight:600}}>{job.client}</div>
<div style={{fontSize:12, color:C.muted}}>{job.address} . {job.jobNumber}</div>
</div>

  {/* Panel section */}
  <div style={{...S.card, padding:12, marginBottom:10}}>
    <div style={{fontSize:12, color:C.green, fontWeight:700, letterSpacing:"0.08em", marginBottom:10}}>☀️ SOLAR PANELS</div>
    {[["panel_count","Panel Count","number"],["panel_make","Panel Make","text"],["panel_model","Panel Model","text"]].map(([k,l,t])=>(
      <div key={k} style={{marginBottom:10}}>
        <label style={S.label}>{l}</label>
        <input style={S.input} type={t} value={a[k]} onChange={e=>set(k,e.target.value)} placeholder={l}/>
      </div>
    ))}
    <button
      onClick={()=>lookupSpecs("panel")}
      disabled={!!lookingUp || !a.panel_make || !a.panel_model}
      style={{...S.btn("ghost"), marginBottom:0, padding:"10px", fontSize:13,
        opacity:(!a.panel_make||!a.panel_model)?0.4:1,
        borderColor:panelSpecs?C.green:C.border,
        color:panelSpecs?C.green:C.accent
      }}>
      {lookingUp==="panel" ? "⏳ Looking up specs..." : panelSpecs ? "✓ Specs Loaded - Re-lookup" : "🔍 Look Up Panel Specs"}
    </button>
    {specCard(panelSpecs, "panel")}
  </div>

  {/* Inverter section */}
  <div style={{...S.card, padding:12, marginBottom:10}}>
    <div style={{fontSize:12, color:C.blue, fontWeight:700, letterSpacing:"0.08em", marginBottom:10}}>⚡ INVERTER</div>
    {[["inverter_make","Inverter Make","text"],["inverter_model","Inverter Model","text"],["inverter_serial","Serial No.","text"]].map(([k,l,t])=>(
      <div key={k} style={{marginBottom:10}}>
        <label style={S.label}>{l}</label>
        <input style={S.input} type={t} value={a[k]} onChange={e=>set(k,e.target.value)} placeholder={l}/>
      </div>
    ))}
    <button
      onClick={()=>lookupSpecs("inverter")}
      disabled={!!lookingUp || !a.inverter_make || !a.inverter_model}
      style={{...S.btn("ghost"), marginBottom:0, padding:"10px", fontSize:13,
        opacity:(!a.inverter_make||!a.inverter_model)?0.4:1,
        borderColor:inverterSpecs?C.blue:C.border,
        color:inverterSpecs?C.blue:C.accent
      }}>
      {lookingUp==="inverter" ? "⏳ Looking up specs..." : inverterSpecs ? "✓ Specs Loaded - Re-lookup" : "🔍 Look Up Inverter Specs"}
    </button>
    {specCard(inverterSpecs, "inverter")}
  </div>

  {/* Meter + locations */}
  <div style={{...S.card, padding:12, marginBottom:10}}>
    <div style={{fontSize:12, color:C.accent, fontWeight:700, letterSpacing:"0.08em", marginBottom:10}}>📊 METER & LOCATIONS</div>
    {[["system_age","System Age (years)","number"],["meter_make","Meter Make","text"],["meter_serial","Meter Serial No.","text"],["meter_reading","Current Meter Reading","number"],["inverter_loc","Inverter Location","text"],["dc_iso_loc","DC Isolator Location","text"],["ac_iso_loc","AC Isolator Location","text"]].map(([k,l,t])=>(
      <div key={k} style={{marginBottom:10}}>
        <label style={S.label}>{l}</label>
        <input style={S.input} type={t} value={a[k]} onChange={e=>set(k,e.target.value)} placeholder={l}/>
      </div>
    ))}
  </div>

  {lookupError && (
    <div style={{...S.card, border:`1px solid ${C.amber}44`, padding:12, marginBottom:10}}>
      <div style={{fontSize:12, color:C.amber}}>⚠ {lookupError}</div>
    </div>
  )}

  <button style={S.btn("primary")} onClick={()=>onNext({...a, inverterSpecs, panelSpecs})}>Continue -></button>
  <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
</div>

);
}

// - TEST RESULTS ---------------
function TestResultsScreen({ initialData, onBack, onNext }) {
const [r, setR] = useState(initialData || {voc:"",isc:"",irradiance:"",ir_pos:"",ir_neg:"",polarity:null,zs:"",rcd_type:"Type A",rcd_trip:"",mcb_rating:"",breaking_cap:"",ocpd_bs:"",ocpd_type:"",switchgear:null,inverter_ok:null,loss_mains:null});
const set = (k,v) => setR(x=>({...x,[k]:v}));
return (
<div style={{padding:16}}>
<div style={S.secTitle}>* Array Test Results</div>
{[["voc","Voc (V)"],["isc","Isc (A)"],["irradiance","Irradiance (W/m2)"],["rcd_trip","RCD Trip Time (ms)"],["mcb_rating","Protective Device Rating (A)"],["breaking_cap","Breaking Capacity (kA)"]].map(([k,l])=>(
<div key={k} style={{marginBottom:12}}><label style={S.label}>{l}</label><input style={S.input} type="text" inputMode="decimal" value={r[k]} onChange={e=>set(k,e.target.value)} placeholder="-"/></div>
))}
{[["ir_pos","IR Pos-Earth (MOhm)"],["ir_neg","IR Neg-Earth (MOhm)"],["zs","Zs (Ohm)"]].map(([k,l])=>{
const isLim = r[k]==="LIM"; const isNa = r[k]==="N/A";
return (
<div key={k} style={{marginBottom:12}}>
<label style={S.label}>{l}</label>
<div style={{display:"flex",gap:6,alignItems:"stretch"}}>
<input style={{...S.input,flex:1,margin:0}} type="text" inputMode="decimal" value={(isLim||isNa)?"":r[k]} onChange={e=>set(k,e.target.value)} placeholder="Enter reading"/>
<button onClick={()=>set(k,isLim?"":"LIM")} style={{padding:"0 16px",borderRadius:7,border:`1.5px solid ${isLim?C.amber:C.border}`,background:isLim?C.amber+"22":"#f8fafc",color:isLim?C.amber:C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>LIM</button>
<button onClick={()=>set(k,isNa?"":"N/A")} style={{padding:"0 16px",borderRadius:7,border:`1.5px solid ${isNa?C.muted:C.border}`,background:isNa?C.muted+"22":"#f8fafc",color:isNa?C.text:C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>N/A</button>
</div>
</div>
);
})}
<div style={{marginBottom:12}}>
<label style={S.label}>RCD Type</label>
<div style={{display:"flex",gap:6}}>
{["Type A","Type B","Type F","Type AC"].map(v=><button key={v} onClick={()=>set("rcd_type",v)} style={{flex:1,background:r.rcd_type===v?C.blue+"22":"#f8fafc",color:r.rcd_type===v?C.blue:C.muted,border:`1px solid ${r.rcd_type===v?C.blue:C.border}`,borderRadius:7,padding:"9px 0",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{v}</button>)}
</div>
</div>
<div style={{marginBottom:12}}>
<label style={S.label}>OCPD Device (BS Number)</label>
<select style={S.input} value={r.ocpd_bs} onChange={e=>set("ocpd_bs",e.target.value)}>
<option value="">-- Select device --</option>
<option value="BS EN 60898">BS EN 60898 — MCB (circuit-breaker)</option>
<option value="BS EN 61009">BS EN 61009 — RCBO</option>
<option value="BS EN 61008">BS EN 61008 — RCCB</option>
<option value="BS EN 60947-2">BS EN 60947-2 — MCCB</option>
<option value="BS EN 60947-3">BS EN 60947-3 — Switch/Isolator</option>
<option value="BS 88">BS 88 — HBC Fuse</option>
<option value="BS 1361">BS 1361 — Cartridge Fuse</option>
<option value="BS 3036">BS 3036 — Rewireable Fuse</option>
<option value="BS EN 62606">BS EN 62606 — AFDD</option>
</select>
</div>
<div style={{marginBottom:12}}>
<label style={S.label}>OCPD Type / Curve</label>
<select style={S.input} value={r.ocpd_type||""} onChange={e=>set("ocpd_type",e.target.value)}>
<option value="">-- Select type --</option>
<optgroup label="MCB / RCBO curve">
<option value="B">Type B (3–5 × In)</option>
<option value="C">Type C (5–10 × In)</option>
<option value="D">Type D (10–20 × In)</option>
</optgroup>
<optgroup label="RCD type">
<option value="AC">Type AC</option>
<option value="A">Type A</option>
<option value="F">Type F</option>
<option value="B (RCD)">Type B (RCD)</option>
</optgroup>
<optgroup label="Fuse">
<option value="gG">gG (general purpose)</option>
<option value="gM">gM (motor circuit)</option>
</optgroup>
</select>
</div>
{[["polarity","Polarity Check"],["switchgear","Switchgear Functioning"],["inverter_ok","Inverter Functioning"],["loss_mains","Loss of Mains Test"]].map(([k,l])=>(
<div key={k} style={{marginBottom:12}}>
<label style={S.label}>{l}</label>
<div style={{display:"flex",gap:6}}>
{[["satisfactory","Satisfactory",C.green],["unsatisfactory","Unsatisfactory",C.red],["na","N/A",C.muted]].map(([v,lbl,col])=>(
<button key={v} onClick={()=>set(k,v)} style={{flex:1,background:r[k]===v?col+"22":"#f8fafc",color:r[k]===v?col:C.muted,border:`1.5px solid ${r[k]===v?col:C.border}`,borderRadius:7,padding:"9px 0",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{lbl}</button>
))}
</div>
</div>
))}
<button style={S.btn("primary")} onClick={()=>onNext(r)}>AI Review -></button>
<button style={S.btn("ghost")} onClick={onBack}>← Back</button>
</div>
);
}

// - AI REVIEW SCREEN --------------
function AIReviewScreen({ job, asset, checklist, testResults, profile, onBack, onComplete }) {
const [loading, setLoading] = useState(false);
const [review, setReview] = useState(null);
const [engineerNotes, setEngineerNotes] = useState("");

const flaggedItems = checklist
? Object.entries(checklist).filter(([,v])=>["no","lim","fi"].includes(v.answer)).map(([k,v])=>({id:k,answer:v.answer,risk:v.risk,note:v.note}))
: [];

const runAI = () => {
setLoading(true);
setTimeout(() => {
const result = runAnalysis(job, asset, checklist, testResults, flaggedItems);
setReview(result);
setLoading(false);
}, 900);
};

const statusCol = review?.overall_status==="Pass"?C.green:review?.overall_status==="Fail"?C.red:C.amber;

return (
<div style={{padding:16}}>
<div style={S.secTitle}>* AI Review Engine</div>
<div style={{...S.card,border:"1px solid #e2e8f0",marginBottom:14,padding:12,background:"#ffffff"}}>
<div style={{display:"flex",justifyContent:"space-between",marginBottom:(asset?.inverterSpecs||asset?.panelSpecs)?8:0}}>
<span style={{fontSize:12,color:C.muted}}>Flagged checklist items</span>
<span style={S.tag(flaggedItems.length>0?C.red:C.green)}>{flaggedItems.length}</span>
</div>
{(asset?.inverterSpecs||asset?.panelSpecs) && (
<div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:4}}>
{asset.inverterSpecs && <span style={S.tag(C.blue)}>⚡ Inverter specs loaded</span>}
{asset.panelSpecs    && <span style={S.tag(C.green)}>☀️ Panel specs loaded</span>}
</div>
)}
</div>

  {!review && !loading && (
    <div style={{...S.card,textAlign:"center",padding:36}}>
      <div style={{fontSize:44,marginBottom:10}}>🧠</div>
      <div style={{fontSize:14,color:C.text,marginBottom:6}}>Ready to analyse inspection data</div>
      <div style={{fontSize:12,color:C.muted,marginBottom:20,lineHeight:1.6}}>Themis will check all checklist answers, missing records, photos, serial numbers and test results against BS7671 / IEC 60364</div>
      <button style={S.btn("primary")} onClick={runAI}>Run AI Review</button>
    </div>
  )}

  {loading && (
    <div style={{...S.card,textAlign:"center",padding:44,background:"#ffffff"}}>
      <div style={{fontSize:36,marginBottom:12}}>⚡</div>
      <div style={{color:C.green,fontSize:14}}>Analysing inspection data...</div>
      <div style={{color:C.muted,fontSize:12,marginTop:6}}>Checking BS7671 / IEC 60364 compliance</div>
    </div>
  )}

  {review && (
    <>
      <div style={{...S.card,border:`2px solid ${statusCol}44`,background:statusCol+"0a",textAlign:"center",marginBottom:14}}>
        <div style={{fontSize:30,fontWeight:700,color:statusCol}}>{review.overall_status?.toUpperCase()}</div>
        <div style={{fontSize:10,color:C.muted,letterSpacing:"0.12em",marginTop:3}}>OVERALL STATUS</div>
      </div>

      <div style={{...S.card,marginBottom:10}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:8,letterSpacing:"0.1em"}}>SUMMARY</div>
        <div style={{fontSize:13,color:C.text,lineHeight:1.7}}>{review.summary}</div>
      </div>

      {review.risk_items?.length>0 && (
        <div style={{...S.card,marginBottom:10}}>
          <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:12,letterSpacing:"0.1em"}}>RISK FINDINGS ({review.risk_items.length})</div>
          {review.risk_items.map((ri,i)=>{
            const col=ri.code==="C2"?C.red:ri.code==="C3"?C.amber:C.purple;
            return (
              <div key={i} style={{borderLeft:`3px solid ${col}`,paddingLeft:12,marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={S.tag(col)}>{ri.code}</span>
                  <span style={{fontSize:13,fontWeight:600,color:C.text}}>{ri.issue}</span>
                </div>
                {ri.regulation && <div style={{fontSize:11,color:C.purple,marginBottom:3}}>{ri.regulation}</div>}
                <div style={{fontSize:12,color:C.muted}}>{ri.recommended_action}</div>
              </div>
            );
          })}
        </div>
      )}

      {review.missing_information?.length>0 && (
        <div style={{...S.card,border:`1px solid ${C.amber}22`,marginBottom:10}}>
          <div style={{fontSize:11,color:C.amber,fontWeight:700,marginBottom:10,letterSpacing:"0.1em"}}>MISSING INFORMATION ({review.missing_information.length})</div>
          {review.missing_information.map((m,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:6,fontSize:12}}>
              <span style={{color:C.amber,flexShrink:0}}>!</span><span style={{color:C.dim}}>{m}</span>
            </div>
          ))}
        </div>
      )}

      {review.recommended_actions?.length>0 && (
        <div style={{...S.card,marginBottom:10}}>
          <div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:10,letterSpacing:"0.1em"}}>RECOMMENDED ACTIONS</div>
          {review.recommended_actions.map((a,i)=>(
            <div key={i} style={{display:"flex",gap:8,marginBottom:8,fontSize:13}}>
              <span style={{color:C.green,flexShrink:0}}>-></span><span style={{color:C.text}}>{a}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{...S.card,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,color:C.muted}}>Next inspection</span>
        <span style={{fontSize:13,color:review.next_inspection==="Immediate"?C.red:C.green,fontWeight:700}}>{review.next_inspection}</span>
      </div>

      {review.tags?.length>0 && (
        <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
          {review.tags.map(t=><span key={t} style={S.tag(C.blue)}>{t}</span>)}
        </div>
      )}

      <div style={{marginBottom:14}}>
        <label style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.05em",display:"block",marginBottom:4}}>ENGINEER'S INSTALLATION NOTES</label>
        <textarea
          style={{width:"100%",padding:"12px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,fontFamily:"inherit",background:"#f8fafc",minHeight:100}}
          placeholder="Describe the installation, any notable observations, site conditions, access issues etc..."
          value={engineerNotes}
          onChange={e=>setEngineerNotes(e.target.value)}
        />
      </div>
      <button style={S.btn("primary")} onClick={()=>onComplete({...review, engineer_notes: engineerNotes})}>View Summary -></button>
    </>
  )}
  <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
</div>

);
}

// - SUMMARY -------------------------
function SummaryScreen({ job, review, onBack, onReport }) {
const statusCol = review?.overall_status==="Pass"?C.green:review?.overall_status==="Fail"?C.red:C.amber;
const c2s = review?.risk_items?.filter(r=>r.code==="C2")||[];
const c3s = review?.risk_items?.filter(r=>r.code==="C3")||[];
const fis = review?.risk_items?.filter(r=>r.code==="FI")||[];
return (
<div style={{padding:16}}>
<div style={S.secTitle}>* Job Summary</div>
<div style={{...S.card,border:`2px solid ${statusCol}44`,marginBottom:14}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
<div><div style={{fontSize:17,fontWeight:700}}>{job.client}</div><div style={{fontSize:12,color:C.muted}}>{job.jobNumber} . {job.mode.toUpperCase()}</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{job.address}</div></div>
<div style={{fontSize:22,fontWeight:800,color:statusCol}}>{review?.overall_status}</div>
</div>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
{[[c2s.length,"C2",C.red],[c3s.length,"C3",C.amber],[fis.length,"FI",C.purple]].map(([n,l,col])=>(
<div key={l} style={{...S.card,textAlign:"center",border:n>0?`1px solid ${col}44`:undefined}}>
<div style={{fontSize:26,fontWeight:700,color:n>0?col:C.muted}}>{n}</div>
<div style={{fontSize:10,color:C.muted,letterSpacing:"0.1em"}}>{l}</div>
</div>
))}
</div>
{review?.missing_information?.length>0 && (
<div style={{...S.card,border:`1px solid ${C.amber}33`,marginBottom:10,padding:12}}>
<div style={{fontSize:11,color:C.amber,fontWeight:700,marginBottom:6}}>⚠ {review.missing_information.length} MISSING RECORDS</div>
{review.missing_information.slice(0,5).map((m,i)=><div key={i} style={{fontSize:12,color:C.dim,marginBottom:3}}>. {m}</div>)}
{review.missing_information.length>5 && <div style={{fontSize:11,color:C.muted}}>+{review.missing_information.length-5} more...</div>}
</div>
)}
<div style={{...S.card,marginBottom:14}}><div style={{fontSize:11,color:C.accent,fontWeight:700,marginBottom:8,letterSpacing:"0.1em"}}>SUMMARY</div><div style={{fontSize:13,color:C.text,lineHeight:1.7}}>{review?.summary}</div></div>
<div style={{...S.card,display:"flex",gap:12,alignItems:"center",marginBottom:18}}>
<div style={{width:38,height:38,borderRadius:"50%",background:C.green+"22",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>✓</div>
<div><div style={{fontSize:13,fontWeight:600}}>Engineer Sign-off</div><div style={{fontSize:12,color:C.muted}}>{job.engineer} . {job.date}</div></div>
</div>
<button style={S.btn("primary")} onClick={()=>onReport("client")}>Generate Client Report</button>
<button style={S.btn("ghost")} onClick={()=>onReport("qa")}>Internal QA Report</button>
<button style={S.btn("ghost")} onClick={onBack}>← Back</button>
</div>
);
}

// - PDF GENERATION ENGINE ------------------
async function generatePDF(job, asset, checklist, testResults, review, type, profile) {
  // Preload any URL-based photos into base64 so jsPDF can embed them
  const loadImageAsDataUrl = (url) => new Promise((resolve) => {
    if (!url || url.startsWith("data:")) { resolve(url); return; }
    fetch(url).then(r=>r.blob()).then(blob=>{
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    }).catch(()=>resolve(null));
  });
  if (checklist) {
    for (const key of Object.keys(checklist)) {
      const photos = checklist[key]?.photos || [];
      for (const p of photos) {
        const src = p.dataUrl || p.url;
        if (src && !src.startsWith("data:")) {
          p.dataUrl = await loadImageAsDataUrl(src);
        }
      }
    }
  }
  const PDF_SECTIONS = [
    { id:"panels", label:"Solar Panels", items:[
      {id:"sp1",q:"Orientation of solar panels"},{id:"sp2",q:"Number of solar panels"},
      {id:"sp3",q:"Location of solar panels"},{id:"sp4",q:"Are the panels damaged?",invert:true},
      {id:"sp5",q:"Are the panels clean / clear of debris?"},{id:"sp6",q:"Can the panel make be identified?"},
      {id:"sp7",q:"Do PV array cables appear to be secure?"},
      {id:"sp8",q:"Has array frame equipotential bonding been installed? (IEC 60364-7-712)"},
      {id:"sp9",q:"Is there evidence of bird / pest damage or fouling?"},
      {id:"sp10",q:"Are all junction boxes secure and undamaged?"},
    ]},
    { id:"inverter", label:"Inverter", items:[
      {id:"inv1",q:"Make"},{id:"inv2",q:"Model"},{id:"inv3",q:"Serial number"},{id:"inv4",q:"Location"},
      {id:"inv5",q:"Is there a smoke detector present at the inverter location? (BS 5839-6)"},
      {id:"inv6",q:"Is the inverter functioning correctly?"},{id:"inv7",q:"Is the inverter clear of debris?"},
      {id:"inv8",q:"Does the inverter have the correct recommended clearances? (BS 7671 reg 134.1.1)"},
      {id:"inv9",q:"Is the inverter installed on a heat resistant / non-combustible material?"},
      {id:"inv10",q:"Is the inverter securely mounted?"},{id:"inv11",q:"Are all LED indicators functioning correctly?"},
    ]},
    { id:"isolation", label:"Isolation", items:[
      {id:"iso1",q:"Is there a DC switch disconnector fitted to DC side of inverter? (IEC 60364-7-712.536.2.2.5)"},
      {id:"iso2",q:"Is the DC isolator correctly labelled?"},{id:"iso3",q:"Is the DC isolator in good working condition?"},
      {id:"iso4",q:"Is there an AC switch disconnector installed?"},{id:"iso5",q:"Is the AC isolator correctly labelled?"},
      {id:"iso6",q:"Is the AC isolator in good working condition?"},
      {id:"iso7",q:"Is the AC isolator correctly installed and meeting minimum IP2x? (BS 7671 416.2.1)"},
      {id:"iso8",q:"Is there an AC isolator local to the distribution equipment?"},
    ]},
    { id:"ac_supply", label:"AC Supply", items:[
      {id:"ac1",q:"Is the installation protected by an RCD?"},{id:"ac2",q:"RCD BS number"},
      {id:"ac3",q:"RCD type"},{id:"ac4",q:"Is the RCD bidirectional rated? (BS 7671 531.3.3)"},
      {id:"ac5",q:"Is there surge protection (SPD) present?"},
      {id:"ac6",q:"Is the array framework equipotential bonded?"},
    ]},
    { id:"labelling", label:"Labelling & Documentation", items:[
      {id:"lab1",q:"Are all circuits, protective devices, switches and terminals suitably labelled?"},
      {id:"lab2",q:"Is the main AC isolator clearly labelled?"},
      {id:"lab3",q:"Are dual supply warning labels fitted at point of interconnection? (BS 7671 712.514)"},
      {id:"lab4",q:"Is a single line wiring diagram displayed on site? (IET CoP 9.7b)"},
      {id:"lab5",q:"Are inverter protection settings and installer details displayed?"},
      {id:"lab6",q:"Are emergency shutdown procedures displayed on site?"},
      {id:"lab7",q:"Are all DC junction boxes carrying warning labels?"},
    ]},
    { id:"meter", label:"Generation Meter", items:[
      {id:"met1",q:"Make"},{id:"met2",q:"Model"},{id:"met3",q:"Serial number"},
      {id:"met4",q:"Current meter reading"},{id:"met5",q:"Is the meter accessible and readable?"},
      {id:"met6",q:"Is the meter correctly labelled?"},
    ]},
    { id:"mechanical", label:"General / Mechanical", items:[
      {id:"mec1",q:"Is ventilation provided behind the array to prevent overheating?"},
      {id:"mec2",q:"Is the array frame and material corrosion proof?"},
      {id:"mec3",q:"Is the array frame correctly fixed and stable with weatherproof roof fixings?"},
      {id:"mec4",q:"Is the cable entry weatherproof?"},
    ]},
  ];

  const COMP_LIFE = {
    inverter: { label:"Inverter",          expected:12 },
    panels:   { label:"Solar Panels",      expected:28 },
    dc_iso:   { label:"DC Isolator",       expected:18 },
    ac_iso:   { label:"AC Isolator",       expected:18 },
    rcd:      { label:"RCD / Protection",  expected:15 },
    wiring:   { label:"DC Wiring",         expected:25 },
    mounting: { label:"Mounting System",   expected:25 },
    meter:    { label:"Generation Meter",  expected:20 },
  };

  const getCondition = (key, age) => {
    const life = COMP_LIFE[key];
    const pct = age / life.expected;
    if (pct < 0.4) return { rating:1, label:"Excellent",   col:[5,150,105],   yrs:`${Math.round((life.expected*0.4)-age)}-${Math.round((life.expected*0.6)-age)} yrs` };
    if (pct < 0.6) return { rating:2, label:"Good",        col:[2,132,199],   yrs:`${Math.round((life.expected*0.6)-age)}-${Math.round((life.expected*0.8)-age)} yrs` };
    if (pct < 0.8) return { rating:3, label:"Monitor",     col:[217,119,6],   yrs:`${Math.round((life.expected*0.8)-age)}-${Math.round(life.expected-age)} yrs` };
    if (pct < 1.0) return { rating:4, label:"Attention",   col:[234,88,12],   yrs:`0-${Math.round(life.expected-age)} yrs` };
    return               { rating:5, label:"End of Life",  col:[220,38,38],   yrs:"Overdue" };
  };

  const getAnswer = (id) => {
    const item = checklist?.[id];
    if (!item) return "-";
    if (item.answer) { const m={yes:"Yes",no:"No",lim:"Limited",fi:"FI",na:"N/A"}; return m[item.answer]||item.answer; }
    if (item.value !== undefined && item.value !== null && item.value !== "") return String(item.value);
    return "-";
  };
  const getNote = (id) => checklist?.[id]?.note || "";

  const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
  const pageW=210, pageH=297, margin=14, contentW=210-14*2;
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});
  const certNum = "TH-"+now.getFullYear()+"-"+String(job?.id||"001").slice(-4);
  const navy=[30,58,95];
  const c2s=(review?.risk_items||[]).filter(r=>r.code==="C2");
  const c3s=(review?.risk_items||[]).filter(r=>r.code==="C3");
  const fis=(review?.risk_items||[]).filter(r=>r.code==="FI");
  const statusCol = review?.overall_status==="Pass"?[5,150,105]:review?.overall_status==="Fail"?[220,38,38]:[217,119,6];
  let pageNum=1;

  const addHeader = (title) => {
    doc.setFillColor(...navy);
    doc.rect(0,0,pageW,18,"F");
    doc.setFillColor(...statusCol);
    doc.rect(0,18,pageW,1.5,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(255,255,255);
    doc.text("THEMIS DIAGNOSTICS", margin, 11);
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(180,200,220);
    doc.text(title, pageW-margin, 11, {align:"right"});
  };

  const addFooter = (n) => {
    doc.setFillColor(245,248,252);
    doc.rect(0,pageH-12,pageW,12,"F");
    doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(120,130,150);
    doc.text("Cert: "+certNum+"  |  "+dateStr+"  |  Themis Diagnostics Solar PV Inspection Platform", margin, pageH-5);
    doc.text("Page "+n, pageW-margin, pageH-5, {align:"right"});
  };

  // ---- PAGE 1: COVER ----
  addHeader(type==="client"?"CLIENT REPORT":"QA REPORT");
  doc.setFillColor(248,250,252);
  doc.rect(margin,26,contentW,52,"F");
  doc.setDrawColor(...statusCol); doc.setLineWidth(0.8);
  doc.rect(margin,26,contentW,52);
  doc.setFont("helvetica","bold"); doc.setFontSize(20); doc.setTextColor(...navy);
  doc.text("Solar PV Inspection Report", margin+8, 42);
  doc.setFontSize(13); doc.setTextColor(...statusCol);
  doc.text(review?.overall_status?.toUpperCase()||"ADVISORY", margin+8, 52);
  doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(60,80,100);
  doc.text("Client:   "+(job?.client||"-"), margin+8, 62);
  doc.text("Address: "+(job?.address||"-"), margin+8, 68);
  doc.text("Job No:  "+(job?.jobNumber||"-")+"     Engineer: "+(job?.engineer||"-"), margin+8, 74);

  // Risk boxes
  [[c2s.length,"C2 URGENT",[220,38,38]],[c3s.length,"C3 ADVISORY",[217,119,6]],[fis.length,"FOR INVESTIGATION",[124,58,237]]].forEach(([n,label,col],i)=>{
    const bx=margin+i*(contentW/3)+2, by=86;
    doc.setFillColor(...col.map(v=>Math.min(255,v+175)));
    doc.roundedRect(bx,by,contentW/3-4,22,3,3,"F");
    doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.setTextColor(...col);
    doc.text(String(n), bx+(contentW/3-4)/2, by+13, {align:"center"});
    doc.setFontSize(7);
    doc.text(label, bx+(contentW/3-4)/2, by+20, {align:"center"});
  });

  // Cert details box
  doc.setFillColor(240,244,248);
  doc.rect(margin,116,contentW,28,"F");
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(80,100,120);
  doc.text("Certificate No: "+certNum, margin+6, 126);
  doc.text("Inspection Date: "+dateStr, margin+6, 133);
  doc.text("Report Type: "+(type==="client"?"Client Report":"QA Report"), margin+6, 140);
  addFooter(pageNum++);

  // ---- PAGE 2: EXECUTIVE SUMMARY ----
  doc.addPage();
  addHeader("EXECUTIVE SUMMARY");
  let y=26;

  const addSection = (title, text, col) => {
    doc.setFont("helvetica","bold"); doc.setFontSize(8.5); doc.setTextColor(...(col||navy));
    doc.text(title, margin, y); y+=4.5;
    doc.setDrawColor(...(col||navy)); doc.setLineWidth(0.3);
    doc.line(margin, y, margin+contentW, y); y+=3.5;
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(50,70,90);
    const lines = doc.splitTextToSize(text, contentW);
    doc.text(lines, margin, y); y+=lines.length*4+6;
  };

  // Report details block
  doc.setFillColor(240,245,252);
  doc.roundedRect(margin,y,contentW,46,3,3,"F");
  doc.setDrawColor(200,215,230); doc.setLineWidth(0.3);
  doc.roundedRect(margin,y,contentW,46,3,3);
  const detailRows = [
    ["Report Type", type==="client"?"Client Solar PV Inspection Report":"QA Solar PV Inspection Report"],
    ["Prepared for", (job?.client||"-")+" | "+(job?.address||"-")],
    ["Inspection by", (profile?.full_name||job?.engineer||"-")+(profile?.qualification?", "+profile.qualification:"")+(profile?.company?", "+profile.company:"")],
    ["Certificate No.", certNum],
    ["Inspection Date", dateStr],
    ["Job Reference", job?.jobNumber||"-"],
  ];
  detailRows.forEach(([k,v],i)=>{
    const ry = y+7+(i*6.5);
    doc.setFont("helvetica","bold"); doc.setFontSize(8); doc.setTextColor(...navy);
    doc.text(k+":", margin+5, ry);
    doc.setFont("helvetica","normal"); doc.setTextColor(50,70,90);
    doc.text(String(v), margin+48, ry);
  });
  y+=52;

  // Status banner
  doc.setFillColor(...statusCol.map(v=>Math.min(255,v+175)));
  doc.roundedRect(margin,y,contentW,14,3,3,"F");
  doc.setFont("helvetica","bold"); doc.setFontSize(10); doc.setTextColor(...statusCol);
  doc.text("Overall Inspection Status: "+(review?.overall_status||"Advisory"), margin+5, y+9);
  y+=20;

  // Purpose
  const purposeMap={inspection:"Periodic inspection of solar PV installation in accordance with the IET Code of Practice for Grid Connected Solar PV Systems (2nd Edition) and BS 7671:2018+A2:2022 Requirements for Electrical Installations.",service:"Routine service and maintenance inspection of solar PV installation to assess system condition, verify safe operation and identify any defects or deterioration.",commissioning:"Commissioning inspection of newly installed solar PV system in accordance with MCS MIS 3002 and IET Code of Practice for Grid Connected Solar PV Systems.",diagnostic:"Diagnostic investigation of reported fault or performance issue with solar PV installation to identify root cause and recommend remedial action.",postfault:"Post-fault inspection following reported system failure or damage to assess extent of defects and recommend remedial works."};
  addSection("PURPOSE OF INSPECTION", purposeMap[job?.mode||"inspection"]||purposeMap.inspection);

  // Scope - auto from mode
  const scopeMap={inspection:"This inspection comprised: visual inspection of all accessible solar PV array components, inverter, isolation devices, AC supply, labelling and documentation; electrical testing including open circuit voltage (Voc), short circuit current (Isc), insulation resistance, earth fault loop impedance (Zs) and RCD testing; review of system documentation and certification.",service:"This inspection comprised: visual inspection of key components, operational check of inverter and generation meter, verification of isolation devices.",commissioning:"This inspection comprised: full commissioning checks in accordance with MCS MIS 3002 including electrical testing, documentation review, labelling verification and system performance assessment.",diagnostic:"This inspection comprised: targeted diagnostic testing and visual inspection focused on the reported fault or performance issue."};
  addSection("SCOPE OF WORKS", scopeMap[job?.mode||"inspection"]||scopeMap.inspection);

  // Standards
  addSection("APPLICABLE STANDARDS & GUIDANCE", "This inspection has been carried out with reference to the following standards and guidance documents:\n\u2022 BS 7671:2018+A2:2022 Requirements for Electrical Installations (IET Wiring Regulations 18th Edition)\n\u2022 IEC 60364-7-712 Solar Photovoltaic (PV) Power Supply Systems\n\u2022 IET Code of Practice for Grid Connected Solar Photovoltaic Systems (2nd Edition)\n\u2022 MCS MIS 3002 Requirements for Contractors Undertaking the Supply, Design, Installation, Set to Work, Commissioning and Handover of Microgeneration Systems\n\u2022 BS 5839-6 Fire Detection and Fire Alarm Systems for Buildings");

  // Limitations
  const limitText = job?.limitations || "No specific limitations were recorded for this inspection. All areas of the installation were accessible and available for inspection at the time of visit.";
  addSection("LIMITATIONS & EXCLUSIONS", limitText, [180,30,30]);

  // Manufacturer recs
  const sysAge = parseInt(asset?.system_age||"0")||0;
  const mfgRecs = sysAge >= 10
    ? "Based on the system age of "+sysAge+" years, the following manufacturer and industry recommendations apply: Inverter manufacturers typically recommend full service or replacement assessment at 10-15 years. Panel manufacturers recommend periodic inspection every 2-5 years to check for cell degradation, delamination and soiling. MCS recommends annual visual inspection with full electrical testing every 5 years or following any fault or adverse weather event."
    : "Manufacturer recommendations vary by component. As a general guide: inverter manufacturers recommend annual inspection; panel manufacturers recommend inspection every 2-5 years; isolation devices should be exercised annually. Refer to specific manufacturer documentation for this installation.";
  addSection("MANUFACTURER RECOMMENDATIONS", mfgRecs);

  // AI Summary
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...navy);
  doc.text("INSPECTION FINDINGS SUMMARY", margin, y); y+=5;
  doc.setDrawColor(...navy); doc.setLineWidth(0.3);
  doc.line(margin, y, margin+contentW, y); y+=4;
  doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(50,70,90);
  const summaryLines = doc.splitTextToSize(review?.summary||"No summary available.", contentW);
  doc.text(summaryLines, margin, y); y+=summaryLines.length*4.5+8;

  // Engineer notes
  if(review?.engineer_notes){
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...navy);
    doc.text("ENGINEER'S INSTALLATION NOTES", margin, y); y+=5;
    doc.line(margin, y, margin+contentW, y); y+=4;
    doc.setFillColor(248,250,252);
    const noteLines=doc.splitTextToSize(review.engineer_notes,contentW-4);
    doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(50,70,90);
    doc.text(noteLines, margin, y); y+=noteLines.length*4.5+8;
  }

  // Risk summary table
  autoTable(doc,{
    startY:y,
    head:[["Category","Count","Description"]],
    body:[
      ["C2 Urgent", String(c2s.length), "Immediate action required - safety critical"],
      ["C3 Advisory", String(c3s.length), "Recommended improvements"],
      ["For Investigation", String(fis.length), "Requires further investigation"],
    ],
    margin:{left:margin,right:margin},
    headStyles:{fillColor:navy,textColor:[255,255,255],fontSize:9},
    bodyStyles:{fontSize:9},
    alternateRowStyles:{fillColor:[248,250,252]},
    columnStyles:{0:{fontStyle:"bold",cellWidth:45},1:{cellWidth:20,halign:"center"}},
    didParseCell:(data)=>{
      if(data.section==="body" && data.column.index===0){
        if(data.row.index===0) data.cell.styles.textColor=[220,38,38];
        else if(data.row.index===1) data.cell.styles.textColor=[217,119,6];
        else data.cell.styles.textColor=[124,58,237];
      }
    },
  });
  y=doc.lastAutoTable.finalY+10;

  // Next inspection
  if(review?.next_inspection){
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...navy);
    doc.text("Recommended Next Inspection: ", margin, y);
    doc.setFont("helvetica","normal"); doc.setTextColor(60,80,100);
    doc.text(review.next_inspection, margin+58, y);
  }
  addFooter(pageNum++);

  // ---- PAGE 3: ASSET REGISTER ----
  doc.addPage();
  addHeader("ASSET REGISTER");
  y=26;
  doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(...navy);
  doc.text("Asset Register", margin, y+8); y+=18;
  autoTable(doc,{
    startY:y,
    head:[["Field","Value"]],
    body:[
      ["Panel Make", asset?.panel_make||"-"],
      ["Panel Model", asset?.panel_model||"-"],
      ["Panel Count", asset?.panel_count?String(asset.panel_count):"-"],
      ["System kWp", asset?.system_kwp?String(asset.system_kwp):"-"],
      ["Inverter Make", asset?.inverter_make||"-"],
      ["Inverter Model", asset?.inverter_model||"-"],
      ["Inverter Serial", asset?.inverter_serial||"-"],
      ["Inverter Location", asset?.inverter_loc||"-"],
      ["DC Isolator Location", asset?.dc_iso_loc||"-"],
      ["AC Isolator Location", asset?.ac_iso_loc||"-"],
      ["Meter Make", asset?.meter_make||"-"],
      ["Meter Serial", asset?.meter_serial||"-"],
      ["Meter Reading", asset?.meter_reading?String(asset.meter_reading):"-"],
      ["System Age", asset?.system_age?asset.system_age+" years":"-"],
      ["System Type", asset?.system_type||"-"],
      ["Inspection Date", dateStr],
      ["Certificate No.", certNum],
    ],
    margin:{left:margin,right:margin},
    headStyles:{fillColor:navy,textColor:[255,255,255],fontSize:9},
    bodyStyles:{fontSize:9},
    alternateRowStyles:{fillColor:[248,250,252]},
    columnStyles:{0:{fontStyle:"bold",cellWidth:55}},
  });
  addFooter(pageNum++);

  // ---- PAGES 4+: INSPECTION CHECKLIST (SafetyCulture-style item blocks) ----
  PDF_SECTIONS.forEach((section)=>{
    doc.addPage();
    addHeader("INSPECTION CHECKLIST - "+section.label.toUpperCase());
    y=26;
    doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(...navy);
    doc.text(section.label, margin, y+8); y+=16;

    const answerColors = {Yes:[5,150,105],No:[220,38,38],Limited:[217,119,6],FI:[124,58,237],"N/A":[148,163,184]};
    const TEXT_W = 110;          // width of text column
    const IMG_X = margin + TEXT_W + 6;  // where photos start
    const IMG_W = 50, IMG_H = 38, IMG_GAP = 4;

    section.items.forEach(item=>{
      const ans = getAnswer(item.id);
      const note = getNote(item.id);
      const photos = (checklist?.[item.id]?.photos || []).map(p=>p.dataUrl||p.url).filter(Boolean);

      // Measure heights
      doc.setFontSize(9);
      const qLines = doc.splitTextToSize(item.q, TEXT_W);
      const noteLines = note ? doc.splitTextToSize("Note: "+note, TEXT_W) : [];
      const textH = qLines.length*4.5 + 5 + (noteLines.length*4) + 6;
      const photoH = photos.length>0 ? photos.length*(IMG_H+IMG_GAP) : 0;
      const blockH = Math.max(textH, photoH) + 4;

      // Page break if needed
      if(y + blockH > pageH - 16){
        doc.addPage();
        addHeader("INSPECTION CHECKLIST - "+section.label.toUpperCase()+" (CONT.)");
        y=30;
      }

      const blockTop = y;
      // Question
      doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(30,41,59);
      doc.text(qLines, margin, y+4); y += qLines.length*4.5 + 2;
      // Result
      doc.setFont("helvetica","bold"); doc.setFontSize(9);
      const rc = answerColors[ans] || [100,116,139];
      doc.setTextColor(...rc);
      doc.text("Result: "+(ans||"-"), margin, y+3); y += 5;
      // Note
      if(noteLines.length){
        doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(100,116,139);
        doc.text(noteLines, margin, y+2); y += noteLines.length*4 + 2;
      }

      // Photos on the right, stacked
      let ipy = blockTop;
      photos.forEach(src=>{
        try { doc.addImage(src, "JPEG", IMG_X, ipy, IMG_W, IMG_H); } catch(e){ console.error("PDF photo error:",e); }
        ipy += IMG_H + IMG_GAP;
      });

      // Advance y to bottom of whichever column is taller
      y = Math.max(y, blockTop + photoH) + 4;
      // Divider line
      doc.setDrawColor(226,232,240); doc.setLineWidth(0.2);
      doc.line(margin, y, pageW-margin, y); y += 5;
    });
    addFooter(pageNum++);
  });

  // ---- PHOTO SUMMARY PAGE: all photos labelled in a grid ----
  const allPhotos = [];
  PDF_SECTIONS.forEach(section=>{
    section.items.forEach(item=>{
      const photos = (checklist?.[item.id]?.photos || []).map(p=>p.dataUrl||p.url).filter(Boolean);
      photos.forEach((src,idx)=>{
        allPhotos.push({ src, label: item.q, section: section.label, multi: photos.length>1?` (${idx+1}/${photos.length})`:"" });
      });
    });
  });

  if(allPhotos.length>0){
    doc.addPage();
    addHeader("PHOTOGRAPHIC SUMMARY");
    y=26;
    doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(...navy);
    doc.text("Photographic Summary", margin, y+8); y+=16;

    const COLS = 3;
    const GW = (pageW - margin*2 - (COLS-1)*6) / COLS;  // grid cell width
    const IMG_H = GW * 0.72;
    const LBL_H = 9;
    const CELL_H = IMG_H + LBL_H + 6;
    let col = 0;
    let rowTop = y;

    allPhotos.forEach((ph)=>{
      const cx = margin + col*(GW+6);
      // page break
      if(rowTop + CELL_H > pageH - 16){
        doc.addPage();
        addHeader("PHOTOGRAPHIC SUMMARY (CONT.)");
        rowTop = 30; col = 0;
      }
      const px = margin + col*(GW+6);
      try { doc.addImage(ph.src, "JPEG", px, rowTop, GW, IMG_H); } catch(e){ console.error("Summary photo error:",e); }
      // Label under photo
      doc.setFont("helvetica","normal"); doc.setFontSize(6.5); doc.setTextColor(100,116,139);
      const lbl = (ph.label.length>52? ph.label.substring(0,50)+"…" : ph.label) + ph.multi;
      const lblLines = doc.splitTextToSize(lbl, GW);
      doc.text(lblLines.slice(0,2), px, rowTop + IMG_H + 4);

      col++;
      if(col>=COLS){ col=0; rowTop += CELL_H; }
    });
    addFooter(pageNum++);
  }


  // ---- NEXT PAGE: TEST RESULTS ----
  doc.addPage();
  addHeader("TEST RESULTS");
  y=26;
  doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(...navy);
  doc.text("Electrical Test Results", margin, y+8); y+=18;
  autoTable(doc,{
    startY:y,
    head:[["Test","Result"]],
    body:[
      ["Voc (Open Circuit Voltage)", testResults?.voc?testResults.voc+" V":"-"],
      ["Isc (Short Circuit Current)", testResults?.isc?testResults.isc+" A":"-"],
      ["Irradiance", testResults?.irradiance?testResults.irradiance+" W/m2":"-"],
      ["IR Pos-Earth", testResults?.ir_pos?testResults.ir_pos+" MOhm":"-"],
      ["IR Neg-Earth", testResults?.ir_neg?testResults.ir_neg+" MOhm":"-"],
      ["Zs (Earth Fault Loop)", testResults?.zs?testResults.zs+" Ohm":"-"],
      ["RCD Trip Time", testResults?.rcd_trip?testResults.rcd_trip+" ms":"-"],
      ["MCB Rating", testResults?.mcb_rating?testResults.mcb_rating+" A":"-"],
      ["OCPD Device (BS No.)", testResults?.ocpd_bs?(testResults.ocpd_bs+(testResults.ocpd_type?" — Type "+testResults.ocpd_type:"")):"-"],
      ["Breaking Capacity", testResults?.breaking_cap?testResults.breaking_cap+" kA":"-"],
      ["Polarity Check", testResults?.polarity||"-"],
      ["Switchgear Functioning", testResults?.switchgear||"-"],
      ["Inverter Status", testResults?.inverter_ok||"-"],
      ["Loss of Mains Test", testResults?.loss_mains||"-"],
      ["RCD Type", testResults?.rcd_type||"-"],
    ],
    margin:{left:margin,right:margin},
    headStyles:{fillColor:navy,textColor:[255,255,255],fontSize:9},
    bodyStyles:{fontSize:9},
    alternateRowStyles:{fillColor:[248,250,252]},
    columnStyles:{0:{fontStyle:"bold",cellWidth:80}},
  });
  addFooter(pageNum++);

  // ---- NEXT PAGE: CONDITIONALITY ----
  doc.addPage();
  addHeader("SYSTEM CONDITIONALITY ASSESSMENT");
  y=26;
  const age=parseInt(asset?.system_age||"0")||0;
  const allRatings=Object.keys(COMP_LIFE).map(k=>getCondition(k,age).rating);
  const overall=Math.max(...allRatings);
  const overallCond=getCondition(Object.keys(COMP_LIFE).find(k=>getCondition(k,age).rating===overall)||"inverter",age);

  doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(...navy);
  doc.text("System Conditionality Assessment", margin, y+8); y+=18;

  // System age / overall banner
  doc.setFillColor(...navy);
  doc.roundedRect(margin,y,contentW,22,3,3,"F");
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(180,200,220);
  doc.text("SYSTEM AGE", margin+6, y+7);
  doc.setFont("helvetica","bold"); doc.setFontSize(16); doc.setTextColor(255,255,255);
  doc.text(age+" years", margin+6, y+18);
  doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(180,200,220);
  doc.text("OVERALL RATING", pageW-margin-50, y+7);
  doc.setFont("helvetica","bold"); doc.setFontSize(18); doc.setTextColor(...overallCond.col);
  doc.text(String(overall), pageW-margin-30, y+18);
  doc.setFontSize(8); doc.text(overallCond.label.toUpperCase(), pageW-margin-50, y+18);
  y+=28;

  // Component table
  autoTable(doc,{
    startY:y,
    head:[["Component","System Age","Rating","Est. Remaining Life"]],
    body:Object.entries(COMP_LIFE).map(([key,comp])=>{
      const cond=getCondition(key,age);
      return [comp.label, age+" yrs", cond.rating+" - "+cond.label, cond.yrs];
    }),
    margin:{left:margin,right:margin},
    headStyles:{fillColor:navy,textColor:[255,255,255],fontSize:9},
    bodyStyles:{fontSize:9},
    alternateRowStyles:{fillColor:[248,250,252]},
    columnStyles:{0:{cellWidth:60},1:{cellWidth:25,halign:"center"},2:{cellWidth:40},3:{cellWidth:57}},
    didParseCell:(data)=>{
      if(data.column.index===2 && data.section==="body"){
        const r=parseInt(data.cell.raw);
        if(r===1) data.cell.styles.textColor=[5,150,105];
        else if(r===2) data.cell.styles.textColor=[2,132,199];
        else if(r===3) data.cell.styles.textColor=[217,119,6];
        else if(r===4) data.cell.styles.textColor=[234,88,12];
        else data.cell.styles.textColor=[220,38,38];
        data.cell.styles.fontStyle="bold";
      }
    },
  });
  y=doc.lastAutoTable.finalY+8;

  // Rating key
  doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...navy);
  doc.text("Rating Key", margin, y+6); y+=10;
  autoTable(doc,{
    startY:y,
    body:[
      ["1 - Excellent","No action required"],
      ["2 - Good","Routine maintenance only"],
      ["3 - Monitor","Components approaching mid-life"],
      ["4 - Attention","Replacements forecast within 3 years"],
      ["5 - End of Life","Immediate replacement recommended"],
    ],
    margin:{left:margin,right:margin},
    bodyStyles:{fontSize:8},
    alternateRowStyles:{fillColor:[248,250,252]},
    columnStyles:{0:{fontStyle:"bold",cellWidth:45}},
    didParseCell:(data)=>{
      if(data.column.index===0 && data.section==="body"){
        const cols=[[5,150,105],[2,132,199],[217,119,6],[234,88,12],[220,38,38]];
        data.cell.styles.textColor=cols[data.row.index]||[60,80,100];
      }
    },
  });
  y=doc.lastAutoTable.finalY+8;
  doc.setFillColor(255,251,235); doc.roundedRect(margin,y,contentW,20,2,2,"F");
  doc.setDrawColor(217,119,6); doc.setLineWidth(0.3); doc.roundedRect(margin,y,contentW,20,2,2);
  doc.setFont("helvetica","bold"); doc.setFontSize(7); doc.setTextColor(180,80,0);
  doc.text("IMPORTANT - INDICATIVE FORECAST ONLY", margin+4, y+6);
  doc.setFont("helvetica","normal"); doc.setTextColor(120,60,0);
  const disclaimer="This conditionality assessment is based on typical component lifespans and visual inspection at the time of visit. Actual replacement timelines may vary depending on usage, maintenance history and environmental conditions.";
  doc.text(doc.splitTextToSize(disclaimer, contentW-8), margin+4, y+11);
  addFooter(pageNum++);

  // ---- NEXT PAGE: COMPLIANCE FINDINGS ----
  doc.addPage();
  addHeader("COMPLIANCE FINDINGS");
  y=26;
  doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(...navy);
  doc.text("Compliance Findings", margin, y+8); y+=18;
  const allRisks=review?.risk_items||[];
  if(allRisks.length===0){
    doc.setFont("helvetica","normal"); doc.setFontSize(10); doc.setTextColor(5,150,105);
    doc.text("No compliance findings identified. Installation passed inspection.", margin, y+6);
  } else {
    autoTable(doc,{
      startY:y,
      head:[["Code","Issue","Regulation","Recommended Action"]],
      body:allRisks.map(r=>[r.code, r.issue||"-", r.regulation||"-", r.recommended_action||"-"]),
      margin:{left:margin,right:margin},
      headStyles:{fillColor:navy,textColor:[255,255,255],fontSize:8},
      bodyStyles:{fontSize:8},
      alternateRowStyles:{fillColor:[248,250,252]},
      columnStyles:{0:{cellWidth:14,fontStyle:"bold"},1:{cellWidth:52},2:{cellWidth:44}},
      didParseCell:(data)=>{
        if(data.column.index===0 && data.section==="body"){
          const code=data.cell.raw;
          if(code==="C2") data.cell.styles.textColor=[220,38,38];
          else if(code==="C3") data.cell.styles.textColor=[217,119,6];
          else if(code==="FI") data.cell.styles.textColor=[124,58,237];
        }
      },
    });
  }
  addFooter(pageNum++);

  // ---- LAST PAGE: SIGN OFF ----
  doc.addPage();
  addHeader("DECLARATION & SIGN-OFF");
  y=26;
  doc.setFillColor(248,250,252); doc.rect(margin,y,contentW,38,"F");
  doc.setDrawColor(200,215,230); doc.setLineWidth(0.3); doc.rect(margin,y,contentW,38);
  doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(60,80,100);
  const decl="I/We, being the person(s) responsible for the inspection and testing of the solar PV installation described in this report, having exercised reasonable skill and care, hereby declare that the information in this report provides an accurate assessment of the condition of the installation at the time of inspection, to the best of my/our knowledge and belief.";
  doc.text(doc.splitTextToSize(decl, contentW-8), margin+4, y+8);
  y+=46;
  // Signature image
  if(profile?.signature_data){
    doc.setFont("helvetica","bold"); doc.setFontSize(9); doc.setTextColor(...navy);
    doc.text("Signature:", margin, y+6); y+=10;
    try { doc.addImage(profile.signature_data,"PNG",margin,y,80,25); y+=30; } catch(e){}
  }
  autoTable(doc,{
    startY:y,
    body:[
      ["Engineer Name", profile?.full_name || job?.engineer||""],
      ["Qualification", profile?.qualification||""],
      ["Registration No.", profile?.reg_number||""],
      ["Company", profile?.company||""],
      ["Date", new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"})],
    ],
    margin:{left:margin,right:margin},
    bodyStyles:{fontSize:10,minCellHeight:14},
    alternateRowStyles:{fillColor:[248,250,252]},
    columnStyles:{0:{fontStyle:"bold",cellWidth:55}},
  });
  addFooter(pageNum++);

  const filename="Themis-"+(job?.client||"Report").replace(/\s+/g,"-")+"-"+certNum+".pdf";
  doc.save(filename);
}


// - INLINE REPORT RENDERER -----------------
function ReportScreen({ job, asset, checklist, testResults, review, type, profile, onDone }) {
const [page, setPage] = useState(0); // 0=menu, 1..N=report pages

const statusCol = review?.overall_status==="Pass"?C.green:review?.overall_status==="Fail"?C.red:C.amber;
const c2s = review?.risk_items?.filter(r=>r.code==="C2")||[];
const c3s = review?.risk_items?.filter(r=>r.code==="C3")||[];
const fis = review?.risk_items?.filter(r=>r.code==="FI")||[];
const iSpecs = asset?.inverterSpecs;
const pSpecs = asset?.panelSpecs;
const now = new Date();
const dateStr = now.toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"});
const certNum = "TH-"+now.getFullYear()+"-"+String(job?.id||"001").slice(-4);

const CHECKLIST_ITEMS = {
panels:[
{id:"sp1",q:"Orientation"},{id:"sp2",q:"Number of panels"},
{id:"sp3",q:"Location"},{id:"sp4",q:"Panels damaged?"},
{id:"sp5",q:"Panels clean / clear of debris?"},
{id:"sp6",q:"Panel make identifiable?"},
{id:"sp7",q:"PV array cables secure?"},
{id:"sp8",q:"Array frame equipotential bonding installed?"},
{id:"sp9",q:"Evidence of bird / pest damage?"},
{id:"sp10",q:"Junction boxes secure?"},
],
inverter:[
{id:"inv1",q:"Make"},{id:"inv2",q:"Model"},
{id:"inv3",q:"Serial number"},{id:"inv4",q:"Location"},
{id:"inv5",q:"Smoke detector at inverter location?"},
{id:"inv6",q:"Inverter functioning correctly?"},
{id:"inv7",q:"Inverter clear of debris?"},
{id:"inv8",q:"Correct recommended clearances?"},
{id:"inv9",q:"Installed on non-combustible material?"},
{id:"inv10",q:"Securely mounted?"},
{id:"inv11",q:"LED indicators functioning?"},
],
isolation:[
{id:"iso1",q:"DC switch disconnector fitted?"},
{id:"iso2",q:"DC isolator correctly labelled?"},
{id:"iso3",q:"DC isolator good condition?"},
{id:"iso4",q:"AC switch disconnector installed?"},
{id:"iso5",q:"AC isolator correctly labelled?"},
{id:"iso6",q:"AC isolator good condition?"},
{id:"iso7",q:"AC isolator meets minimum IP2x?"},
{id:"iso8",q:"AC isolator local to distribution equipment?"},
],
ac_supply:[
{id:"ac1",q:"Protected by RCD?"},{id:"ac2",q:"RCD BS number"},
{id:"ac3",q:"RCD type"},{id:"ac4",q:"RCD bidirectional rated?"},
{id:"ac5",q:"Surge protection (SPD) present?"},
{id:"ac6",q:"Array framework equipotential bonded?"},
],
labelling:[
{id:"lab1",q:"All circuits suitably labelled?"},
{id:"lab2",q:"Main AC isolator clearly labelled?"},
{id:"lab3",q:"Dual supply warning labels fitted?"},
{id:"lab4",q:"Single line wiring diagram on site?"},
{id:"lab5",q:"Installer details displayed?"},
{id:"lab6",q:"Emergency shutdown procedure displayed?"},
{id:"lab7",q:"DC junction box warning labels?"},
],
meter:[
{id:"met1",q:"Make"},{id:"met2",q:"Model"},
{id:"met3",q:"Serial number"},{id:"met4",q:"Current reading"},
{id:"met5",q:"Meter accessible?"},{id:"met6",q:"Meter correctly labelled?"},
],
mechanical:[
{id:"mec1",q:"Ventilation behind array?"},
{id:"mec2",q:"Array frame corrosion proof?"},
{id:"mec3",q:"Array frame correctly fixed?"},
{id:"mec4",q:"Cable entry weatherproof?"},
],
};

const SECTION_LABELS = {
panels:"Solar Panels", inverter:"Inverter",
isolation:"Isolation", ac_supply:"AC Supply",
labelling:"Labelling & Documentation",
meter:"Generation Meter", mechanical:"General / Mechanical",
};

const ansCol = a => a==="yes"?C.green:a==="no"?C.red:a==="lim"?C.amber:a==="fi"?C.purple:C.muted;
const ansLabel = a => a==="yes"?"Yes":a==="no"?"No":a==="lim"?"Lim":a==="fi"?"FI":a==="na"?"N/A":"-";

const Tag = ({code}) => {
const col = code==="C2"?C.red:code==="C3"?C.amber:code==="FI"?C.purple:C.blue;
return <span style={{background:col+"22",color:col,border:`1px solid ${col}44`,borderRadius:5,padding:"2px 8px",fontSize:10,fontWeight:700,letterSpacing:"0.05em"}}>{code}</span>;
};

const Row = ({label,value,highlight}) => (
<div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"1px solid #e2e8f0",paddingBottom:8,marginBottom:8}}>
<span style={{fontSize:12,color:C.muted,flex:1}}>{label}</span>
<span style={{fontSize:13,fontWeight:600,color:highlight||"#1e293b",textAlign:"right",flex:1,paddingLeft:8}}>{value||"-"}</span>
</div>
);

const PageHeader = ({section,title}) => (
<div style={{marginBottom:24}}>
<div style={{fontSize:10,color:"#1e3a5f",letterSpacing:"0.12em",marginBottom:2,fontWeight:700}}>{section}</div>
<div style={{fontSize:22,fontWeight:700,marginBottom:8,color:"#1e293b"}}>{title}</div>
<div style={{width:50,height:3,background:"#059669",borderRadius:2}}/>
</div>
);

const pages = [

// -- PAGE 0: COVER --------------------------------------
<div style={{minHeight:"85vh",background:"#1e3a5f",borderRadius:16,padding:28,display:"flex",flexDirection:"column",justifyContent:"space-between",border:`1px solid ${C.border}`}}>
  <div>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32}}>
      <span style={{fontSize:28,filter:`drop-shadow(0 0 12px ${C.green})`}}>⚡</span>
      <div>
        <div style={{fontSize:18,fontWeight:700,color:C.green,letterSpacing:"0.1em"}}>THEMIS</div>
        <div style={{fontSize:9,color:C.muted,letterSpacing:"0.2em"}}>DIAGNOSTICS</div>
      </div>
    </div>
    <div style={{borderLeft:`4px solid ${statusCol}`,paddingLeft:16,marginBottom:28}}>
      <div style={{fontSize:10,color:C.muted,letterSpacing:"0.15em",marginBottom:6}}>{type==="client"?"SOLAR PV INSPECTION REPORT":"INTERNAL QA REPORT"}</div>
      <div style={{fontSize:26,fontWeight:700,lineHeight:1.2,marginBottom:6}}>{job?.client}</div>
      <div style={{fontSize:13,color:C.muted}}>{job?.address}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:24}}>
      {[["Job No.",job?.jobNumber||"-"],["Date",dateStr],["Engineer",job?.engineer||"-"],["Mode",(job?.mode||"inspection").toUpperCase()],["Cert No.",certNum],["System Age",asset?.system_age?asset.system_age+" yrs":"-"]].map(([k,v])=>(
        <div key={k} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 12px"}}>
          <div style={{fontSize:9,color:C.muted,letterSpacing:"0.1em",marginBottom:3}}>{k}</div>
          <div style={{fontSize:12,fontWeight:600,color:C.text}}>{v}</div>
        </div>
      ))}
    </div>
  </div>
  <div>
    <div style={{background:statusCol+"18",border:`2px solid ${statusCol}44`,borderRadius:12,padding:"16px 24px",textAlign:"center",marginBottom:16}}>
      <div style={{fontSize:9,color:statusCol,letterSpacing:"0.15em",marginBottom:2}}>OVERALL STATUS</div>
      <div style={{fontSize:32,fontWeight:700,color:statusCol}}>{review?.overall_status?.toUpperCase()||"-"}</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
      {[[c2s.length,"C2",C.red],[c3s.length,"C3",C.amber],[fis.length,"FI",C.purple]].map(([n,l,col])=>(
        <div key={l} style={{background:col+"18",border:`1px solid ${col}33`,borderRadius:8,padding:"12px",textAlign:"center",background:"#ffffff"}}>
          <div style={{fontSize:24,fontWeight:700,color:col}}>{n}</div>
          <div style={{fontSize:9,color:col,letterSpacing:"0.1em"}}>{l}</div>
        </div>
      ))}
    </div>
  </div>
</div>,

// -- PAGE 1: EXEC SUMMARY -------------------------------
<div style={{padding:4}}>
  <PageHeader section="SECTION 1" title="Executive Summary"/>
  <div style={{...S.card,marginBottom:12}}>
    <div style={{fontSize:13,color:C.text,lineHeight:1.8}}>{review?.summary}</div>
  </div>
  {review?.recommended_actions?.length>0 && (
    <div style={{...S.card,marginBottom:12}}>
      <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"0.1em",marginBottom:12}}>RECOMMENDED ACTIONS</div>
      {review.recommended_actions.map((a,i)=>(
        <div key={i} style={{display:"flex",gap:10,marginBottom:10}}>
          <span style={{color:C.green,fontWeight:700,minWidth:20}}>{i+1}.</span>
          <span style={{fontSize:13,color:C.text,lineHeight:1.5}}>{a}</span>
        </div>
      ))}
    </div>
  )}
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
    <div style={{...S.card,textAlign:"center"}}>
      <div style={{fontSize:9,color:C.muted,marginBottom:4}}>NEXT INSPECTION</div>
      <div style={{fontSize:16,fontWeight:700,color:review?.next_inspection==="Immediate"?C.red:C.green}}>{review?.next_inspection||"12 months"}</div>
    </div>
    <div style={{...S.card,textAlign:"center"}}>
      <div style={{fontSize:9,color:C.muted,marginBottom:4}}>MISSING RECORDS</div>
      <div style={{fontSize:16,fontWeight:700,color:(review?.missing_information?.length||0)>0?C.amber:C.green}}>{review?.missing_information?.length||0} items</div>
    </div>
  </div>
</div>,

// -- PAGE 2: ASSET REGISTER -----------------------------
<div style={{padding:4}}>
  <PageHeader section="SECTION 2" title="Asset Register"/>
  <div style={{...S.card,marginBottom:12}}>
    <div style={{fontSize:11,color:C.blue,fontWeight:700,letterSpacing:"0.08em",marginBottom:12}}>☀️ SOLAR PANELS</div>
    <Row label="Panel Count" value={asset?.panel_count}/>
    <Row label="Panel Make" value={asset?.panel_make}/>
    <Row label="Panel Model" value={asset?.panel_model}/>
    <Row label="System Age" value={asset?.system_age?asset.system_age+" years":null}/>
  </div>
  <div style={{...S.card,marginBottom:12}}>
    <div style={{fontSize:11,color:C.blue,fontWeight:700,letterSpacing:"0.08em",marginBottom:12}}>⚡ INVERTER</div>
    <Row label="Make" value={asset?.inverter_make}/>
    <Row label="Model" value={asset?.inverter_model}/>
    <Row label="Serial No." value={asset?.inverter_serial} highlight={!asset?.inverter_serial?C.red:C.green}/>
    <Row label="Location" value={asset?.inverter_loc}/>
    <Row label="DC Isolator Location" value={asset?.dc_iso_loc}/>
    <Row label="AC Isolator Location" value={asset?.ac_iso_loc}/>
  </div>
  <div style={S.card}>
    <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"0.08em",marginBottom:12}}>📊 GENERATION METER</div>
    <Row label="Make" value={asset?.meter_make}/>
    <Row label="Serial No." value={asset?.meter_serial} highlight={!asset?.meter_serial?C.red:C.green}/>
    <Row label="Reading at Inspection" value={asset?.meter_reading?asset.meter_reading+" kWh":null}/>
  </div>
</div>,

// -- PAGE 3: MANUFACTURER SPECS -------------------------
...(iSpecs||pSpecs?[<div style={{padding:4}}>
  <PageHeader section="SECTION 3" title="Manufacturer Specifications"/>
  {iSpecs && (
    <div style={{...S.card,marginBottom:12}}>
      <div style={{fontSize:11,color:C.blue,fontWeight:700,letterSpacing:"0.08em",marginBottom:12}}>⚡ {iSpecs._make} {iSpecs._model}</div>
      {[["Rated Power",iSpecs.rated_power_w?iSpecs.rated_power_w+"W":null],["Max DC Voltage",iSpecs.max_dc_voltage_v?iSpecs.max_dc_voltage_v+"V":null],["Rated Voc",iSpecs.rated_voc_v?iSpecs.rated_voc_v+"V":null],["Rated Isc",iSpecs.rated_isc_a?iSpecs.rated_isc_a+"A":null],["MPPT Range",iSpecs.mppt_range_v],["Efficiency",iSpecs.efficiency_pct?iSpecs.efficiency_pct+"%":null],["IP Rating",iSpecs.ip_rating],["Min Clearance Top",iSpecs.min_clearance_top_mm?iSpecs.min_clearance_top_mm+"mm":null],["Min Clearance Sides",iSpecs.min_clearance_sides_mm?iSpecs.min_clearance_sides_mm+"mm":null],["Mounting Surface",iSpecs.mounting_surface],["Operating Temp",iSpecs.operating_temp_min_c!=null?iSpecs.operating_temp_min_c+"degC to "+iSpecs.operating_temp_max_c+"degC":null],["Protection Class",iSpecs.protection_class]].map(([k,v])=>v?<Row key={k} label={k} value={v}/>:null)}
      {iSpecs.key_notes&&<div style={{background:C.amber+"11",border:`1px solid ${C.amber}33`,borderRadius:8,padding:10,marginTop:8}}><div style={{fontSize:10,color:C.amber,fontWeight:700,marginBottom:4}}>⚠ MANUFACTURER NOTES</div><div style={{fontSize:12,color:C.dim,lineHeight:1.5}}>{iSpecs.key_notes}</div></div>}
    </div>
  )}
  {pSpecs && (
    <div style={S.card}>
      <div style={{fontSize:11,color:C.green,fontWeight:700,letterSpacing:"0.08em",marginBottom:12}}>☀️ {pSpecs._make} {pSpecs._model}</div>
      {[["Rated Power",pSpecs.rated_power_w?pSpecs.rated_power_w+"Wp":null],["Voc",pSpecs.voc_v?pSpecs.voc_v+"V":null],["Vmp",pSpecs.vmp_v?pSpecs.vmp_v+"V":null],["Isc",pSpecs.isc_a?pSpecs.isc_a+"A":null],["Max System Voltage",pSpecs.max_system_voltage_v?pSpecs.max_system_voltage_v+"V":null],["Cell Type",pSpecs.cell_type],["Efficiency",pSpecs.efficiency_pct?pSpecs.efficiency_pct+"%":null],["IP Rating",pSpecs.ip_rating]].map(([k,v])=>v?<Row key={k} label={k} value={v}/>:null)}
    </div>
  )}
</div>]:[]),

// -- PAGE 4: TEST RESULTS -------------------------------
<div style={{padding:4}}>
  <PageHeader section={`SECTION ${iSpecs||pSpecs?"4":"3"}`} title="Array Test Results"/>
  <div style={S.card}>
    {[
      ["Voc (Open Circuit Voltage)", testResults?.voc, "V", iSpecs?.rated_voc_v?iSpecs.rated_voc_v+"V rated":"-"],
      ["Isc (Short Circuit Current)", testResults?.isc, "A", pSpecs?.isc_a?pSpecs.isc_a+"A rated":"-"],
      ["Irradiance", testResults?.irradiance, "W/m2", "-"],
      ["IR Pos-Earth", testResults?.ir_pos, "MOhm", ">=1MOhm"],
      ["IR Neg-Earth", testResults?.ir_neg, "MOhm", ">=1MOhm"],
      ["Polarity Check", testResults?.polarity, "", "Satisfactory"],
      ["Zs", testResults?.zs, "Ohm", "-"],
      ["RCD Type", testResults?.rcd_type, "", "Type A min"],
      ["RCD Trip Time", testResults?.rcd_trip, "ms", "<=300ms"],
      ["MCB Rating", testResults?.mcb_rating, "A", "-"],
      ["OCPD Device (BS No.)", testResults?.ocpd_bs?(testResults.ocpd_bs+(testResults.ocpd_type?" — Type "+testResults.ocpd_type:"")):null, "", "-"],
      ["Breaking Capacity", testResults?.breaking_cap, "kA", "-"],
      ["Switchgear Function", testResults?.switchgear, "", "Satisfactory"],
      ["Inverter Function", testResults?.inverter_ok, "", "Satisfactory"],
      ["Loss of Mains", testResults?.loss_mains, "", "Satisfactory"],
    ].map(([label,val,unit,limit])=>{
      if(!val) return (
        <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #e2e8f0",paddingBottom:8,marginBottom:8,gap:8}}>
          <span style={{fontSize:12,color:C.muted,flex:2}}>{label}</span>
          <span style={{fontSize:11,color:C.muted,flex:1,textAlign:"center"}}>-</span>
          <span style={{fontSize:10,color:C.muted+"88",flex:1,textAlign:"right"}}>{limit}</span>
          <span style={{background:C.muted+"22",color:C.muted,border:`1px solid ${C.muted}44`,borderRadius:4,padding:"2px 6px",fontSize:9,fontWeight:700,minWidth:50,textAlign:"center"}}>N/R</span>
        </div>
      );
      const display = val+(unit?" "+unit:"");
      const fail = val==="unsatisfactory"||(unit==="MOhm"&&parseFloat(val)<1)||(unit==="ms"&&parseFloat(val)>300)||val==="fail";
      const passCol = fail?C.red:C.green;
      const passLabel = fail?"FAIL":"PASS";
      return (
        <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #e2e8f0",paddingBottom:8,marginBottom:8,gap:8}}>
          <span style={{fontSize:12,color:C.text,flex:2}}>{label}</span>
          <span style={{fontSize:13,fontWeight:700,color:passCol,flex:1,textAlign:"center"}}>{display}</span>
          <span style={{fontSize:10,color:C.muted,flex:1,textAlign:"right"}}>{limit}</span>
          <span style={{background:passCol+"22",color:passCol,border:`1px solid ${passCol}44`,borderRadius:4,padding:"2px 6px",fontSize:9,fontWeight:700,minWidth:50,textAlign:"center"}}>{passLabel}</span>
        </div>
      );
    })}
  </div>
</div>,

// -- PAGE 5: CHECKLIST ----------------------------------
<div style={{padding:4}}>
  <PageHeader section={`SECTION ${iSpecs||pSpecs?"5":"4"}`} title="Inspection Checklist"/>
  {Object.entries(CHECKLIST_ITEMS).map(([secId,items])=>{
    const label = SECTION_LABELS[secId]||secId;
    const flagged = items.filter(i=>{const a=checklist?.[i.id]?.answer;return["no","lim","fi"].includes(a);}).length;
    const done = items.filter(i=>checklist?.[i.id]?.answer||checklist?.[i.id]?.value).length;
    return (
      <div key={secId} style={{...S.card,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:12,fontWeight:700,color:"#1e3a5f"}}>{label}</div>
          <div style={{display:"flex",gap:6}}>
            {flagged>0&&<span style={S.tag(C.red)}>{flagged} flagged</span>}
            <span style={{fontSize:10,color:C.muted}}>{done}/{items.length}</span>
          </div>
        </div>
        {items.map(item=>{
          const ia = checklist?.[item.id]||{};
          const a = ia.answer||null;
          const v = ia.value||null;
          const flag = ["no","lim","fi"].includes(a);
          const display = a?ansLabel(a):v||"-";
          const col = a?ansCol(a):C.muted;
          return (
            <div key={item.id}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderTop:`1px solid ${C.border}20`,paddingTop:8,marginTop:8,background:flag?"rgba(248,113,113,0.04)":"transparent",borderRadius:4,padding:"6px 4px"}}>
                <span style={{fontSize:12,color:flag?C.text:C.dim,flex:3,lineHeight:1.4}}>{item.q}</span>
                <span style={{background:col+"22",color:col,border:`1px solid ${col}44`,borderRadius:4,padding:"2px 8px",fontSize:10,fontWeight:700,marginLeft:8,flexShrink:0}}>{display}</span>
              </div>
              {ia.note&&<div style={{fontSize:11,color:C.muted,paddingLeft:4,paddingBottom:4,fontStyle:"italic"}}>{ia.note}</div>}
              {ia.risk&&<div style={{paddingLeft:4,paddingBottom:6}}><Tag code={ia.risk}/></div>}
              {ia.photos?.length>0&&(
                <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"4px 4px 8px"}}>
                  {ia.photos.map(p=>(
                    <img key={p.id} src={p.dataUrl} alt="" style={{width:80,height:60,objectFit:"cover",borderRadius:6,border:`1px solid ${C.border}`}}/>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  })}
</div>,

// -- PAGE 6: COMPLIANCE FINDINGS -----------------------
<div style={{padding:4}}>
  <PageHeader section={`SECTION ${iSpecs||pSpecs?"6":"5"}`} title="Compliance Findings"/>
  <div style={{fontSize:11,color:C.muted,marginBottom:16,lineHeight:1.6}}>
    C2 - Potentially Dangerous (urgent action) . C3 - Improvement Recommended . FI - Further Investigation Required
  </div>
  {review?.risk_items?.length>0?(
    review.risk_items.map((r,i)=>{
      const col=r.code==="C2"?C.red:r.code==="C3"?C.amber:C.purple;
      return (
        <div key={i} style={{...S.card,borderLeft:`4px solid ${col}`,marginBottom:10,background:"#ffffff"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <Tag code={r.code}/>
            <span style={{fontSize:13,fontWeight:600,color:C.text}}>{r.issue}</span>
          </div>
          {r.regulation&&<div style={{fontSize:11,color:C.purple,marginBottom:4}}>{r.regulation}</div>}
          <div style={{fontSize:12,color:C.muted}}>-> {r.recommended_action}</div>
        </div>
      );
    })
  ):(
    <div style={{...S.card,textAlign:"center",padding:24}}>
      <div style={{color:C.green,fontSize:14}}>✓ No compliance issues identified</div>
    </div>
  )}
  {review?.missing_information?.length>0&&(
    <div style={{...S.card,border:`1px solid ${C.amber}33`,marginTop:16}}>
      <div style={{fontSize:11,color:C.amber,fontWeight:700,marginBottom:10,letterSpacing:"0.08em"}}>⚠ MISSING RECORDS ({review.missing_information.length})</div>
      {review.missing_information.map((m,i)=>(
        <div key={i} style={{fontSize:12,color:C.dim,marginBottom:6,display:"flex",gap:8}}>
          <span style={{color:C.amber,flexShrink:0}}>{i+1}.</span>{m}
        </div>
      ))}
    </div>
  )}
</div>,

// -- PAGE 7: SIGN OFF -----------------------------------
<div style={{padding:4}}>
  <PageHeader section={`SECTION ${iSpecs||pSpecs?"7":"6"}`} title="Declaration & Sign-off"/>
  <div style={{...S.card,marginBottom:16}}>
    <div style={{fontSize:13,color:C.dim,lineHeight:1.8}}>
      I/We, being the person(s) responsible for the inspection and testing of the solar PV installation described in this report, having exercised reasonable skill and care, hereby declare that the information in this report provides an accurate assessment of the condition of the installation at the time of inspection.
    </div>
  </div>
  <div style={{...S.card,marginBottom:12}}>
    <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"0.08em",marginBottom:12}}>ENGINEER SIGN-OFF</div>
    <Row label="Name" value={job?.engineer}/>
    <Row label="Position" value="Solar PV Engineer / Electrician"/>
    <Row label="Date" value={dateStr}/>
    <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:8}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:32}}>Signature</div>
      <div style={{borderBottom:`1px solid ${C.border}`,marginBottom:4}}/>
    </div>
  </div>
  <div style={{...S.card,marginBottom:24}}>
    <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"0.08em",marginBottom:12}}>QUALIFIED SUPERVISOR SIGN-OFF</div>
    <Row label="Name" value=""/>
    <Row label="Position" value="Qualified Supervisor"/>
    <Row label="Date" value=""/>
    <div style={{borderTop:`1px solid ${C.border}`,paddingTop:16,marginTop:8}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:32}}>Signature</div>
      <div style={{borderBottom:`1px solid ${C.border}`,marginBottom:4}}/>
    </div>
  </div>
  <div style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      <span style={{fontSize:18}}>⚡</span>
      <div>
        <div style={{fontSize:12,fontWeight:700,color:C.green}}>THEMIS DIAGNOSTICS</div>
        <div style={{fontSize:10,color:C.muted}}>Solar PV Inspection Platform</div>
      </div>
    </div>
    <div style={{textAlign:"right"}}>
      <div style={{fontSize:10,color:C.muted}}>Cert: {certNum}</div>
      <div style={{fontSize:10,color:C.muted}}>{dateStr}</div>
    </div>
  </div>
</div>,

];

const totalPages = pages.length;

if (page === 0) {
// Report menu
return (
<div style={{padding:16}}>
<div style={S.secTitle}>* {type==="client"?"Client Report":"Internal QA Report"}</div>
<div style={{...S.card,border:`2px solid ${statusCol}44`,marginBottom:14}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
<div>
<div style={{fontSize:11,color:C.muted,marginBottom:2}}>{type==="client"?"CLIENT":"QA"} REPORT</div>
<div style={{fontSize:16,fontWeight:700}}>{job?.client}</div>
<div style={{fontSize:11,color:C.muted}}>{job?.jobNumber}</div>
</div>
<div style={{fontSize:20,fontWeight:800,color:statusCol}}>{review?.overall_status}</div>
</div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:14}}>
{[[c2s.length,"C2",C.red],[c3s.length,"C3",C.amber],[fis.length,"FI",C.purple]].map(([n,l,col])=>(
<div key={l} style={{background:"#ffffff",border:`1px solid ${col}33`,borderRadius:8,padding:"10px",textAlign:"center"}}>
<div style={{fontSize:22,fontWeight:700,color:col}}>{n}</div>
<div style={{fontSize:10,color:col}}>{l}</div>
</div>
))}
</div>
<div style={{fontSize:11,color:C.muted,marginBottom:8}}>Report sections:</div>
{["Cover Page","Executive Summary","Asset Register",...(iSpecs||pSpecs?["Manufacturer Specs"]:[]),"Test Results","Inspection Checklist","Compliance Findings","Sign-off"].map((s,i)=>(
<div key={i} style={{display:"flex",gap:8,marginBottom:5,alignItems:"center"}}>
<span style={{color:C.green,fontSize:10}}>></span>
<span style={{fontSize:12,color:C.dim}}>{s}</span>
</div>
))}
</div>
<button style={{...S.btn("primary"),fontSize:15,padding:"16px"}} onClick={()=>setPage(1)}>
📄 View Report
</button>
<button style={{...S.btn("primary"),fontSize:15,padding:"16px",background:"#059669",marginTop:8}} onClick={()=>generatePDF(job,asset,checklist,testResults,review,type,profile)}>
⬇ Download PDF
</button>
<button style={S.btn("ghost")} onClick={onDone}>← Dashboard</button>
</div>
);
}

// Report page viewer
return (
<div style={{paddingBottom:40}}>
{/* Nav bar */}
<div style={{background:"#1e3a5f",borderBottom:"3px solid #059669",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
<button onClick={()=>setPage(p=>Math.max(0,p-1))} style={{background:"none",border:"1px solid rgba(255,255,255,0.3)",color:"rgba(255,255,255,0.8)",borderRadius:8,padding:"6px 12px",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>
{page===1?"✕ Close":"← Prev"}
</button>
<div style={{fontSize:11,color:"rgba(255,255,255,0.8)",fontWeight:700}}>
{["Cover","Summary","Assets","Specs","Tests","Checklist","Findings","Sign-off"].filter((_,i)=>(iSpecs||pSpecs)||i!==3)[page-1]?.toUpperCase()} . {page}/{totalPages}
</div>
<button onClick={()=>page<totalPages?setPage(p=>p+1):setPage(0)} style={{background:page<totalPages?"#059669":"transparent",border:`1px solid ${page<totalPages?"#059669":"rgba(255,255,255,0.3)"}`,color:page<totalPages?"#ffffff":"rgba(255,255,255,0.5)",borderRadius:8,padding:"6px 12px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
{page<totalPages?"Next ->":"Done"}
</button>
</div>
<div style={{background:"#0f2744",padding:"8px 16px",textAlign:"center"}}>
<button onClick={()=>generatePDF(job,asset,checklist,testResults,review,type,profile)} style={{background:"#059669",border:"none",color:"#ffffff",borderRadius:8,padding:"8px 20px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
  ⬇ Download PDF
</button>
</div>

  {/* Page content */}
  <div style={{padding:16}}>
    {pages[page-1]}
  </div>

  {/* Page dots */}
  <div style={{display:"flex",justifyContent:"center",gap:6,padding:"8px 0"}}>
    {pages.map((_,i)=>(
      <div key={i} onClick={()=>setPage(i+1)} style={{width:i+1===page?20:6,height:6,borderRadius:3,background:i+1===page?"#059669":"#e2e8f0",cursor:"pointer",transition:"all 0.2s"}}/>
    ))}
  </div>
</div>

);
}


// - PROFILE SCREEN ----------------------
function ProfileScreen({ user, profile, onSave, onBack }) {
const [fullName,    setFullName]    = useState(profile?.full_name    || "");
const [qual,        setQual]        = useState(profile?.qualification || "");
const [regNum,      setRegNum]      = useState(profile?.reg_number    || "");
const [company,     setCompany]     = useState(profile?.company       || "");
const [sig,         setSig]         = useState(profile?.signature_data || null);
const [drawing,     setDrawing]     = useState(false);
const canvasRef = useRef(null);
const lastPos   = useRef(null);
const [saving,  setSaving] = useState(false);

const startDraw = (e) => {
  setDrawing(true);
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches?.[0] || e;
  lastPos.current = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
};

const draw = (e) => {
  if (!drawing) return;
  e.preventDefault();
  const canvas = canvasRef.current;
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches?.[0] || e;
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  ctx.beginPath();
  ctx.moveTo(lastPos.current.x, lastPos.current.y);
  ctx.lineTo(x, y);
  ctx.strokeStyle = "#1e3a5f";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";
  ctx.stroke();
  lastPos.current = { x, y };
};

const stopDraw = () => {
  setDrawing(false);
  setSig(canvasRef.current.toDataURL());
};

const clearSig = () => {
  const canvas = canvasRef.current;
  canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  setSig(null);
};

const handleSave = async () => {
  setSaving(true);
  await onSave({ full_name: fullName, qualification: qual, reg_number: regNum, company, signature_data: sig });
  setSaving(false);
};

return (
<div style={{padding:16}}>
  <div style={{fontSize:18,fontWeight:700,color:"#1e3a5f",marginBottom:20}}>Engineer Profile</div>

  {[["Full Name", fullName, setFullName],["Qualification (e.g. MCS, NICEIC)", qual, setQual],["Registration Number", regNum, setRegNum],["Company", company, setCompany]].map(([label,val,setter])=>(
    <div key={label} style={{marginBottom:14}}>
      <label style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.05em",display:"block",marginBottom:4}}>{label.toUpperCase()}</label>
      <input style={{width:"100%",padding:"12px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:15,fontFamily:"inherit",background:"#f8fafc"}}
        value={val} onChange={e=>setter(e.target.value)} placeholder={label}/>
    </div>
  ))}

  <div style={{marginBottom:14}}>
    <label style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.05em",display:"block",marginBottom:4}}>SIGNATURE</label>
    <div style={{border:"1.5px solid #e2e8f0",borderRadius:10,background:"#f8fafc",overflow:"hidden",position:"relative"}}>
      {sig && <img src={sig} style={{width:"100%",display:"block"}} alt="signature"/>}
      <canvas
        ref={canvasRef}
        width={340} height={100}
        style={{display:sig?"none":"block",width:"100%",touchAction:"none",cursor:"crosshair"}}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
      />
      {!sig && <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",color:"#cbd5e1",fontSize:12,pointerEvents:"none"}}>Sign here with your finger</div>}
    </div>
    <button onClick={clearSig} style={{marginTop:6,fontSize:11,color:"#64748b",background:"none",border:"none",cursor:"pointer",padding:0}}>Clear signature</button>
  </div>

  <button onClick={handleSave} disabled={saving} style={{width:"100%",padding:"14px",background:"#1e3a5f",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>
    {saving ? "Saving..." : "Save Profile"}
  </button>
  <button onClick={onBack} style={{width:"100%",padding:"12px",background:"none",color:"#64748b",border:"1.5px solid #e2e8f0",borderRadius:12,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
</div>
);
}


// ============================================================
// ============================================================
// EICR MODULE v2 - Matches BS 7671 Certificate Exactly
// ============================================================

// SECTION 12 - Exact inspection items from BS 7671
const EICR_SECTIONS = [
  { id:"intake", label:"1.0 Intake Equipment (Visual Inspection Only)", note:"An outcome against an item in this section, other than access to live parts, should not be used to determine the overall outcome.", items:[
    {id:"1.1.1", q:"Service cable"},
    {id:"1.1.2", q:"Service head"},
    {id:"1.1.3", q:"Earthing arrangement"},
    {id:"1.1.4", q:"Meter tails"},
    {id:"1.1.5", q:"Metering equipment"},
    {id:"1.1.6", q:"Isolator (where present)"},
    {id:"1.2",   q:"Consumer's isolator (where present)"},
    {id:"1.3",   q:"Consumer's meter tails"},
  ]},
  { id:"microgen", label:"2.0 Adequate Arrangements for Other Sources (Microgenerators)", items:[
    {id:"2.1", q:"Adequate arrangements for microgenerators/other sources (551.6; 551.7)"},
  ]},
  { id:"earthing", label:"3.0 Earthing / Bonding Arrangements (411.3; Chap 54)", items:[
    {id:"3.1", q:"Presence and condition of distributor's earthing arrangement (542.1.2.1; 542.1.2.2)"},
    {id:"3.2", q:"Presence and condition of earth electrode connection where applicable (542.1.2.3)"},
    {id:"3.3", q:"Provision of earthing/bonding labels at all appropriate locations (514.13.1)"},
    {id:"3.4", q:"Confirmation of earthing conductor size (542.3; 543.1.1)"},
    {id:"3.5", q:"Accessibility and condition of earthing conductor at MET (543.3.2)"},
    {id:"3.6", q:"Confirmation of main protective bonding conductor sizes (544.1)"},
    {id:"3.7", q:"Condition and accessibility of main protective bonding conductor connections (543.3.2; 544.1.2)"},
    {id:"3.8", q:"Accessibility and condition of other protective bonding connections (543.3.1; 543.3.2)"},
  ]},
  { id:"cu", label:"4.0 Consumer Unit(s) / Distribution Board(s)", items:[
    {id:"4.1",  q:"Adequacy of working space/accessibility to consumer unit/distribution board (132.12; 513.1)"},
    {id:"4.2",  q:"Security of fixing (134.1.1)"},
    {id:"4.3",  q:"Condition of enclosure(s) in terms of IP rating etc (416.2)"},
    {id:"4.4",  q:"Condition of enclosure(s) in terms of fire rating etc (421.1.201; 526.5)"},
    {id:"4.5",  q:"Enclosure not damaged/deteriorated so as to impair safety (651.2)"},
    {id:"4.6",  q:"Presence of main linked switch (as required by 462.1.201)"},
    {id:"4.7",  q:"Operation of main switch (functional check) (643.10)"},
    {id:"4.8",  q:"Manual operation of circuit-breakers and RCDs to prove disconnection (643.10)"},
    {id:"4.9",  q:"Correct identification of circuit details and protective devices (514.8.1; 514.9.1)"},
    {id:"4.10", q:"Presence of RCD six-monthly test notice, where required (514.12.2)"},
    {id:"4.11", q:"Presence of alternative supply warning notice at or near consumer unit/distribution board (514.15)"},
    {id:"4.12", q:"Presence of other required labelling (please specify) (Section 514)"},
    {id:"4.13", q:"Compatibility of protective devices, bases and other components; correct type and rating — no signs of unacceptable thermal damage, arcing or overheating (411.3.2; 411.4; 411.5; 411.6; Sections 432, 433)"},
    {id:"4.14", q:"Single-pole switching or protective devices in line conductor only (132.14.1; 530.3.3)"},
    {id:"4.15", q:"Protection against mechanical damage where cables enter consumer unit/distribution board (132.14.1; 522.8.1; 522.8.5; 522.8.11)"},
    {id:"4.16", q:"Protection against electromagnetic effects where cables enter consumer unit/distribution board/enclosures (521.5.1)"},
    {id:"4.17", q:"RCD(s) provided for fault protection — includes RCBOs (411.4.204; 411.5.2; 531.2)"},
    {id:"4.18", q:"RCD(s) provided for additional protection/requirements — includes RCBOs (411.3.3; 415.1)"},
    {id:"4.19", q:"Confirmation of indication that SPD is functional (651.4)"},
    {id:"4.20", q:"Confirmation that ALL conductor connections, including connections to busbars, are correctly located in terminals and are tight and secure (526.1)"},
    {id:"4.21", q:"Adequate arrangements where a generating set operates as a switched alternative to the public supply (551.6)"},
    {id:"4.22", q:"Adequate arrangements where a generating set operates in parallel with the public supply (551.7)"},
  ]},
  { id:"final", label:"5.0 Final Circuits", items:[
    {id:"5.1",    q:"Identification of conductors (514.3.1)"},
    {id:"5.2",    q:"Cables correctly supported throughout their run (521.10.202; 522.8.5)"},
    {id:"5.3",    q:"Condition of insulation of live parts (416.1)"},
    {id:"5.4",    q:"Non-sheathed cables protected by enclosure in conduit, ducting or trunking (521.10.1)"},
    {id:"5.4.1",  q:"Integrity of conduit and trunking systems (metallic and plastic)"},
    {id:"5.5",    q:"Adequacy of cables for current-carrying capacity with regard for the type and nature of installation (Section 523)"},
    {id:"5.6",    q:"Coordination between conductors and overload protective devices (433.1; 533.2.1)"},
    {id:"5.7",    q:"Adequacy of protective devices: type and rated current for fault protection (411.3)"},
    {id:"5.8",    q:"Presence and adequacy of circuit protective conductors (411.3.1; Section 543)"},
    {id:"5.9",    q:"Wiring system(s) appropriate for the type and nature of the installation and external influences (Section 522)"},
    {id:"5.10",   q:"Concealed cables installed in prescribed zones — see Section 4 Extent and Limitations (522.6.202)"},
    {id:"5.11",   q:"Cables concealed under floors, above ceilings or in walls/partitions, adequately protected against damage — see Section 4 (522.6.204)"},
    {id:"5.12.1", q:"Additional protection RCD ≤30mA — for all socket-outlets of rating 32A or less, unless exception permitted (411.3.3)"},
    {id:"5.12.2", q:"Additional protection RCD ≤30mA — for supply of mobile equipment not exceeding 32A rating for use outdoors (411.3.3)"},
    {id:"5.12.3", q:"Additional protection RCD ≤30mA — for cables concealed in walls at depth less than 50mm (522.6.202; 522.6.203)"},
    {id:"5.12.4", q:"Additional protection RCD ≤30mA — for cables in walls/partitions containing metal parts regardless of depth (522.6.203)"},
    {id:"5.12.5", q:"Additional protection RCD ≤30mA — final circuits supplying luminaires within domestic premises (411.3.4)"},
    {id:"5.13",   q:"Provision of fire barriers, sealing arrangements and protection against thermal effects (Section 527)"},
    {id:"5.14",   q:"Band II cables segregated/separated from Band I cables (528.1)"},
    {id:"5.15",   q:"Cables segregated/separated from communications cabling (528.2)"},
    {id:"5.16",   q:"Cables segregated/separated from non-electrical services (528.3)"},
    {id:"5.17.1", q:"Termination of cables — connections soundly made and under no undue strain (526.6)"},
    {id:"5.17.2", q:"Termination of cables — no basic insulation of a conductor visible outside enclosure (526.8)"},
    {id:"5.17.3", q:"Termination of cables — connections of live conductors adequately enclosed (526.5)"},
    {id:"5.17.4", q:"Termination of cables — adequately connected at point of entry to enclosure, glands, bushes etc. (522.8.5)"},
    {id:"5.18",   q:"Condition of accessories including socket-outlets, switches and joint boxes (651.2(v))"},
    {id:"5.19",   q:"Suitability of accessories for external influences (512.2)"},
    {id:"5.20",   q:"Adequacy of working space/accessibility to equipment (132.12; 513.1)"},
    {id:"5.21",   q:"Single-pole switching or protective devices in line conductors only (132.14.1; 530.3.3)"},
  ]},
  { id:"bathroom", label:"6.0 Location(s) Containing a Bath or Shower", items:[
    {id:"6.1", q:"Additional protection for all LV circuits by RCD not exceeding 30mA (701.411.3.3)"},
    {id:"6.2", q:"Where used as a protective measure, requirements for SELV or PELV met (701.414.4.5)"},
    {id:"6.3", q:"Shaver supply units comply with BS EN 61558-2-5 formerly BS 3535 (701.512.3)"},
    {id:"6.4", q:"Presence of supplementary bonding conductors, unless not required by BS 7671:2018 (701.415.2)"},
    {id:"6.5", q:"Low voltage (e.g. 230V) socket-outlets sited at least 2.5m from zone 1 (701.512.3)"},
    {id:"6.6", q:"Suitability of equipment for external influences for installed location in terms of IP rating (701.512.2)"},
    {id:"6.7", q:"Suitability of accessories and controlgear etc. for a particular zone (701.512.3)"},
    {id:"6.8", q:"Suitability of current-using equipment for particular position within the location (701.55)"},
  ]},
  { id:"special", label:"7.0 Other Part 7 Special Installations or Locations", items:[
    {id:"7.1", q:"Special installation or location 1 (specify if applicable)"},
    {id:"7.2", q:"Special installation or location 2 (specify if applicable)"},
  ]},
  { id:"prosumer", label:"8.0 Prosumer's Low Voltage Electrical Installation(s)", items:[
    {id:"8.1", q:"Additional requirements relating to Chapter 82 — item 1"},
    {id:"8.2", q:"Additional requirements relating to Chapter 82 — item 2"},
  ]},
];

const EICR_OUTCOMES = [
  {v:"pass", l:"PASS", col:"#059669", bg:"#f0fdf4"},
  {v:"c1",   l:"C1",   col:"#dc2626", bg:"#fef2f2"},
  {v:"c2",   l:"C2",   col:"#ea580c", bg:"#fff7ed"},
  {v:"c3",   l:"C3",   col:"#d97706", bg:"#fffbeb"},
  {v:"fi",   l:"FI",   col:"#7c3aed", bg:"#faf5ff"},
  {v:"lim",  l:"LIM",  col:"#0284c7", bg:"#f0f9ff"},
  {v:"nv",   l:"N/V",  col:"#64748b", bg:"#f8fafc"},
  {v:"na",   l:"N/A",  col:"#94a3b8", bg:"#f8fafc"},
];

// ---- SCREEN 1: SECTIONS 1-4 (Front Sheet) ----

// ============================================================
// RIVERSIDE GROUP - DEFAULT TEMPLATE DATA
// ============================================================
const RIVERSIDE_TEMPLATE = {
  id: "riverside",
  name: "Riverside Group",
  client_address: "The Riverside Group\n2 Estuary Boulevard\nLiverpool\nL24 8RF",
  client_rep: "Iain Hardman",
  purpose: "To check the electrical fixed wiring within the property for safety of continued use, and to highlight any non-compliances with the current BS 7671 regulations that may give rise to danger. Fixed electrical equipment is to be also verified as fit for purpose and safe for continued use.",
  extent: "This report covers the inspection and testing of the fixed electrical wiring system within the named property, with the exception of any agreed or operational limitations as documented.",
  occupier_titles: [
    "Riverside - Void",
    "Riverside - Responsive Repairs",
    "Riverside - Mutual Exchange",
    "Riverside - Planned",
    "Riverside - Testing Programme"
  ],
  next_inspection_options: [
    "1 Year or change of tenancy",
    "2 Years or change of tenancy",
    "3 Years or change of tenancy",
    "5 Years or change of tenancy",
    "10 Years or change of tenancy"
  ],
  agreed_limitations: [
    "100% of electrical accessories to be visually checked externally. As a minimum, 20% of electrical accessories to be opened for inspection. Sample size may be increased dependent upon findings.",
    "The main heating system for the property shall be tested with circuit protective conductor continuity confirmed at all relevant points. Insulation resistance tests will also be carried out.",
    "The fixed wiring (AC) of photovoltaic systems (PV) is to form part of the inspection and testing process. The fixed wiring is to be tested to the furthest point of isolation (AC) with a visual inspection undertaken beyond the point of isolation to verify the system is safe for continued use.",
    "In communal areas, specialist installations inclusive of lifts and fire alarms shall not be considered as part of the electrical fixed wiring of the property and shall be tested up to the point of local isolation only.",
    "Where storage heaters provide the source of heating, the circuit shall be tested to the point of isolation only, with the circuit protective conductor continuity confirmed at the appliance by the R2 testing method. A visual inspection of the appliance shall also be undertaken to confirm adequacy."
  ],
  operational_limitations: [
    "DNO supply fuse information not obtainable in every case where practically possible. Where the distribution network operator cannot provide the required information, the fuse characteristics shall be recorded as 'LIM' on the report.",
    "For circuits supplying very large or integrated appliances, the final point of testing shall be considered as the control switch or spur and not the socket outlet behind the appliance, to minimise damage to floor areas by moving of appliances and prevent damage to appliances during testing.",
    "Live insulation resistance testing may be omitted as part of the testing carried out, in order to minimise risk of damage to sensitive equipment (tenanted properties only).",
    "Some accessories may be inaccessible. Each individual case shall be recorded as an operational limitation along with the reason as to why this is the case (tenanted properties only).",
    "'Off-peak' systems which have not had live testing undertaken due to the installation not being energised at the time of the inspection, are to be subject to a thorough visual inspection, with all circuits subject to the relevant 'dead' tests as detailed in BS 7671 and Guidance Note 3."
  ]
};

// ============================================================
// TEMPLATE MANAGER SCREEN
// ============================================================
function TemplateManagerScreen({ onBack }) {
  const [templates, setTemplates] = useState([RIVERSIDE_TEMPLATE]);
  const [editingId, setEditingId] = useState(null);
  const [view, setView] = useState("list"); // list | edit | new_limit
  const [newAgreed, setNewAgreed] = useState("");
  const [newOp, setNewOp] = useState("");
  const [addingTo, setAddingTo] = useState(null); // "agreed" | "operational"

  const editing = templates.find(t => t.id === editingId);

  const updateTemplate = (id, key, val) => {
    setTemplates(ts => ts.map(t => t.id === id ? { ...t, [key]: val } : t));
  };

  const addLimitation = (type) => {
    const text = type === "agreed" ? newAgreed.trim() : newOp.trim();
    if (!text) return;
    const key = type === "agreed" ? "agreed_limitations" : "operational_limitations";
    updateTemplate(editingId, key, [...(editing[key] || []), text]);
    if (type === "agreed") setNewAgreed("");
    else setNewOp("");
    setAddingTo(null);
  };

  const removeLimitation = (type, idx) => {
    const key = type === "agreed" ? "agreed_limitations" : "operational_limitations";
    updateTemplate(editingId, key, editing[key].filter((_, i) => i !== idx));
  };

  const addTemplate = () => {
    const id = "tmpl_" + Date.now();
    setTemplates(ts => [...ts, {
      id, name: "New Template",
      client_address: "", client_rep: "", purpose: "", extent: "",
      occupier_titles: [], next_inspection_options: ["5 Years or change of tenancy"],
      agreed_limitations: [], operational_limitations: []
    }]);
    setEditingId(id);
    setView("edit");
  };

  const LimitItem = ({ text, letter, onRemove }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 10px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0", marginBottom: 6 }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1e3a5f", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{letter}</div>
      <div style={{ flex: 1, fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{text}</div>
      <button onClick={onRemove} style={{ background: "none", border: "none", color: "#dc2626", fontSize: 16, cursor: "pointer", padding: 0, flexShrink: 0 }}>×</button>
    </div>
  );

  if (view === "edit" && editing) return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>TEMPLATE MANAGER</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 16 }}>{editing.name}</div>

      {/* Basic Info */}
      <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: "8px 8px 0 0", padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>CLIENT DETAILS</div>
      <div style={{ border: "1.5px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12, marginBottom: 12 }}>
        <label style={S.label}>Template Name</label>
        <input style={S.input} value={editing.name} onChange={e => updateTemplate(editingId, "name", e.target.value)} />
        <label style={S.label}>Client Address</label>
        <textarea style={{ ...S.input, minHeight: 70 }} value={editing.client_address} onChange={e => updateTemplate(editingId, "client_address", e.target.value)} />
        <label style={S.label}>Client Representative</label>
        <input style={S.input} value={editing.client_rep} onChange={e => updateTemplate(editingId, "client_rep", e.target.value)} />
      </div>

      {/* Purpose & Extent */}
      <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: "8px 8px 0 0", padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>PURPOSE & EXTENT</div>
      <div style={{ border: "1.5px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12, marginBottom: 12 }}>
        <label style={S.label}>Purpose (Section 5.9)</label>
        <textarea style={{ ...S.input, minHeight: 80 }} value={editing.purpose} onChange={e => updateTemplate(editingId, "purpose", e.target.value)} />
        <label style={S.label}>Extent (Section 5.10)</label>
        <textarea style={{ ...S.input, minHeight: 80 }} value={editing.extent} onChange={e => updateTemplate(editingId, "extent", e.target.value)} />
      </div>

      {/* Agreed Limitations */}
      <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: "8px 8px 0 0", padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>AGREED LIMITATIONS (a, b, c...)</div>
      <div style={{ border: "1.5px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12, marginBottom: 12 }}>
        {(editing.agreed_limitations || []).map((lim, i) => (
          <LimitItem key={i} text={lim} letter={String.fromCharCode(97 + i)} onRemove={() => removeLimitation("agreed", i)} />
        ))}
        {addingTo === "agreed" ? (
          <div style={{ marginTop: 8 }}>
            <textarea style={{ ...S.input, minHeight: 60 }} value={newAgreed} onChange={e => setNewAgreed(e.target.value)} placeholder="Enter limitation text..." autoFocus />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button style={S.btn("primary")} onClick={() => addLimitation("agreed")}>Add</button>
              <button style={S.btn("ghost")} onClick={() => { setAddingTo(null); setNewAgreed(""); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={{ ...S.btn("ghost"), marginTop: 8 }} onClick={() => setAddingTo("agreed")}>+ Add Agreed Limitation</button>
        )}
      </div>

      {/* Operational Limitations */}
      <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: "8px 8px 0 0", padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>OPERATIONAL LIMITATIONS (1, 2, 3...)</div>
      <div style={{ border: "1.5px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12, marginBottom: 12 }}>
        {(editing.operational_limitations || []).map((lim, i) => (
          <LimitItem key={i} text={lim} letter={i + 1} onRemove={() => removeLimitation("operational", i)} />
        ))}
        {addingTo === "operational" ? (
          <div style={{ marginTop: 8 }}>
            <textarea style={{ ...S.input, minHeight: 60 }} value={newOp} onChange={e => setNewOp(e.target.value)} placeholder="Enter limitation text..." autoFocus />
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <button style={S.btn("primary")} onClick={() => addLimitation("operational")}>Add</button>
              <button style={S.btn("ghost")} onClick={() => { setAddingTo(null); setNewOp(""); }}>Cancel</button>
            </div>
          </div>
        ) : (
          <button style={{ ...S.btn("ghost"), marginTop: 8 }} onClick={() => setAddingTo("operational")}>+ Add Operational Limitation</button>
        )}
      </div>

      <button style={S.btn("primary")} onClick={() => setView("list")}>← Save & Back to Templates</button>
    </div>
  );

  // Template List
  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>SETTINGS</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 16 }}>Client Templates</div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>Templates pre-populate purpose, extent, and limitations on EICR reports. Engineers select the template on the front sheet.</div>

      {templates.map(t => (
        <div key={t.id} style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1e3a5f" }}>{t.name}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.agreed_limitations?.length || 0} agreed · {t.operational_limitations?.length || 0} operational limitations</div>
          </div>
          <button onClick={() => { setEditingId(t.id); setView("edit"); }} style={{ padding: "8px 16px", borderRadius: 8, border: "1.5px solid #1e3a5f", background: "#fff", color: "#1e3a5f", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Edit</button>
        </div>
      ))}

      <button style={S.btn("primary")} onClick={addTemplate}>+ New Template</button>
      <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
    </div>
  );
}

// ============================================================
// UPDATED EICRFrontSheetScreen WITH TEMPLATE SUPPORT
// ============================================================
function EICRFrontSheetScreen({ job, initialData, onBack, onNext }) {
  const BUILT_IN_TEMPLATES = [RIVERSIDE_TEMPLATE];

  const [d, setD] = useState(initialData || {
    template_id: "",
    reason: "",
    wiring_age: "",
    evidence_additions: false,
    additions_age: "",
    records_available: "N/A",
    last_inspection: "",
    purpose: "",
    extent: "",
    agreed_limitation_ids: [],   // indices into template agreed list
    operational_limitation_ids: [], // indices into template operational list
    agreed_with: "",
    overall_assessment: "SATISFACTORY",
    next_inspection: "",
    occupier_title: "",
  });
  const set = (k, v) => setD(x => ({ ...x, [k]: v }));

  const selectedTemplate = BUILT_IN_TEMPLATES.find(t => t.id === d.template_id) || null;

  const applyTemplate = (tmplId) => {
    const tmpl = BUILT_IN_TEMPLATES.find(t => t.id === tmplId);
    if (!tmpl) { set("template_id", ""); return; }
    setD(x => ({
      ...x,
      template_id: tmplId,
      purpose: tmpl.purpose,
      extent: tmpl.extent,
      agreed_with: tmpl.client_rep,
      agreed_limitation_ids: [],
      operational_limitation_ids: [],
      occupier_title: "",
      next_inspection: "",
    }));
  };

  const toggleAgreed = (idx) => {
    const ids = d.agreed_limitation_ids || [];
    set("agreed_limitation_ids", ids.includes(idx) ? ids.filter(i => i !== idx) : [...ids, idx].sort((a, b) => a - b));
  };

  const toggleOp = (idx) => {
    const ids = d.operational_limitation_ids || [];
    set("operational_limitation_ids", ids.includes(idx) ? ids.filter(i => i !== idx) : [...ids, idx].sort((a, b) => a - b));
  };

  // Build summary strings for display
  const agreedSummary = () => {
    const ids = d.agreed_limitation_ids || [];
    if (!ids.length) return "None";
    return ids.map(i => String.fromCharCode(97 + i)).join(", ") + " — please refer to continuation sheet";
  };

  const opSummary = () => {
    const ids = d.operational_limitation_ids || [];
    if (!ids.length) return "None";
    return ids.map(i => i + 1).join(", ") + " — please refer to continuation sheet";
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>ELECTRICAL INSTALLATION CONDITION REPORT</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 16 }}>Front Sheet — Sections 1–6</div>

      {/* Template Selector */}
      <div style={{ background: "#0f766e", color: "#fff", borderRadius: "8px 8px 0 0", padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>CLIENT TEMPLATE</div>
      <div style={{ border: "1.5px solid #0f766e", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12, marginBottom: 12 }}>
        <label style={S.label}>Select client template</label>
        <select style={{ ...S.input, background: "#f8fafc" }} value={d.template_id} onChange={e => applyTemplate(e.target.value)}>
          <option value="">-- No template (manual entry) --</option>
          {BUILT_IN_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {selectedTemplate && (
          <div style={{ marginTop: 8 }}>
            <label style={S.label}>Occupier title</label>
            <select style={{ ...S.input, background: "#f8fafc" }} value={d.occupier_title} onChange={e => set("occupier_title", e.target.value)}>
              <option value="">-- Select --</option>
              {selectedTemplate.occupier_titles.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Section 2 - Reason */}
      <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: "8px 8px 0 0", padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>2 REASON FOR PRODUCING THIS REPORT</div>
      <div style={{ border: "1.5px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12, marginBottom: 12 }}>
        <label style={S.label}>Reason for producing this report</label>
        <textarea style={{ ...S.input, minHeight: 70 }} value={d.reason} onChange={e => set("reason", e.target.value)} placeholder="e.g. To ensure safe continued use of the electrical installation in line with cyclical programme." />
      </div>

      {/* Section 3 - Installation Details */}
      <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: "8px 8px 0 0", padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>3 DETAILS OF THE INSTALLATION</div>
      <div style={{ border: "1.5px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12, marginBottom: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div><label style={S.label}>Estimated Age of Wiring (years)</label><input style={S.input} type="number" value={d.wiring_age} onChange={e => set("wiring_age", e.target.value)} /></div>
          <div><label style={S.label}>Date of Last Inspection</label><input style={S.input} type="date" value={d.last_inspection} onChange={e => set("last_inspection", e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, padding: "10px 12px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8 }}>
          <span style={{ fontSize: 13, color: "#334155", flex: 1 }}>Evidence of additions/alterations?</span>
          <button onClick={() => set("evidence_additions", !d.evidence_additions)} style={{ padding: "6px 14px", borderRadius: 6, border: "1.5px solid", borderColor: d.evidence_additions ? "#1e3a5f" : "#e2e8f0", background: d.evidence_additions ? "#1e3a5f" : "#fff", color: d.evidence_additions ? "#fff" : "#94a3b8", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{d.evidence_additions ? "YES" : "NO"}</button>
        </div>
        {d.evidence_additions && <div><label style={S.label}>If yes, estimated age of additions (years)</label><input style={S.input} type="number" value={d.additions_age} onChange={e => set("additions_age", e.target.value)} /></div>}
        <div><label style={S.label}>Installation records available? (Regulation 651.1)</label>
          <select style={{ ...S.input, background: "#f8fafc" }} value={d.records_available} onChange={e => set("records_available", e.target.value)}>
            {["Yes", "No", "N/A"].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Section 4 - Extent & Limitations */}
      <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: "8px 8px 0 0", padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>4 EXTENT AND LIMITATIONS OF INSPECTION AND TESTING</div>
      <div style={{ border: "1.5px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12, marginBottom: 12 }}>

        {/* Purpose */}
        <label style={S.label}>Purpose of the report</label>
        {selectedTemplate ? (
          <div style={{ fontSize: 12, color: "#334155", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, padding: "10px 12px", marginBottom: 10, lineHeight: 1.6 }}>{d.purpose}</div>
        ) : (
          <textarea style={{ ...S.input, minHeight: 70 }} value={d.purpose} onChange={e => set("purpose", e.target.value)} placeholder="Enter purpose of report..." />
        )}

        {/* Extent */}
        <label style={S.label}>Extent of the electrical installation covered by this report</label>
        {selectedTemplate ? (
          <div style={{ fontSize: 12, color: "#334155", background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 8, padding: "10px 12px", marginBottom: 10, lineHeight: 1.6 }}>{d.extent}</div>
        ) : (
          <textarea style={{ ...S.input, minHeight: 70 }} value={d.extent} onChange={e => set("extent", e.target.value)} placeholder="e.g. Inspection and testing of the complete electrical installation..." />
        )}

        {/* Agreed Limitations */}
        <label style={S.label}>Agreed limitations (Regulation 653.2)</label>
        {selectedTemplate ? (
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Select limitations that apply to this job:</div>
            {(selectedTemplate.agreed_limitations || []).map((lim, i) => {
              const selected = (d.agreed_limitation_ids || []).includes(i);
              return (
                <button key={i} onClick={() => toggleAgreed(i)} style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "1.5px solid", borderColor: selected ? "#1e3a5f" : "#e2e8f0", background: selected ? "#eef2ff" : "#f8fafc", marginBottom: 6, cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid", borderColor: selected ? "#1e3a5f" : "#cbd5e1", background: selected ? "#1e3a5f" : "#fff", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{selected ? String.fromCharCode(97 + i) : String.fromCharCode(97 + i)}</div>
                  <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{lim}</span>
                </button>
              );
            })}
            {(d.agreed_limitation_ids || []).length > 0 && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#1e3a5f", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600 }}>
                📋 Certificate will show: Agreed limitations {agreedSummary()}
              </div>
            )}
          </div>
        ) : (
          <textarea style={{ ...S.input, minHeight: 70 }} value={d.agreed_limitations || ""} onChange={e => set("agreed_limitations", e.target.value)} placeholder="e.g. Entering roof voids shall only be carried out if safe to do so..." />
        )}

        <div style={{ marginTop: 10 }}>
          <label style={S.label}>Agreed with</label>
          <input style={S.input} value={d.agreed_with} onChange={e => set("agreed_with", e.target.value)} placeholder="e.g. Riverside Group" />
        </div>

        {/* Operational Limitations */}
        <label style={{ ...S.label, marginTop: 10 }}>Operational limitations</label>
        {selectedTemplate ? (
          <div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Select operational limitations that apply to this job:</div>
            {(selectedTemplate.operational_limitations || []).map((lim, i) => {
              const selected = (d.operational_limitation_ids || []).includes(i);
              return (
                <button key={i} onClick={() => toggleOp(i)} style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 8, border: "1.5px solid", borderColor: selected ? "#0f766e" : "#e2e8f0", background: selected ? "#f0fdfa" : "#f8fafc", marginBottom: 6, cursor: "pointer", fontFamily: "inherit" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid", borderColor: selected ? "#0f766e" : "#cbd5e1", background: selected ? "#0f766e" : "#fff", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                  <span style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>{lim}</span>
                </button>
              );
            })}
            {(d.operational_limitation_ids || []).length > 0 && (
              <div style={{ marginTop: 8, padding: "8px 12px", background: "#0f766e", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600 }}>
                📋 Certificate will show: Operational limitations {opSummary()}
              </div>
            )}
          </div>
        ) : (
          <textarea style={{ ...S.input, minHeight: 70 }} value={d.operational_limitations || ""} onChange={e => set("operational_limitations", e.target.value)} placeholder="e.g. Various equipment obstructing accessories throughout..." />
        )}
      </div>

      {/* Section 5 - Overall Assessment */}
      <div style={{ background: "#1e3a5f", color: "#fff", borderRadius: "8px 8px 0 0", padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>5 SUMMARY OF THE CONDITION OF THE INSTALLATION</div>
      <div style={{ border: "1.5px solid #1e3a5f", borderTop: "none", borderRadius: "0 0 8px 8px", padding: 12, marginBottom: 12 }}>
        <label style={S.label}>Overall assessment of the installation in terms of suitability for continued use</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {["SATISFACTORY", "UNSATISFACTORY"].map(v => (
            <button key={v} onClick={() => set("overall_assessment", v)} style={{ padding: "14px 8px", borderRadius: 8, border: "2px solid", borderColor: d.overall_assessment === v ? (v === "SATISFACTORY" ? "#059669" : "#dc2626") : "#e2e8f0", background: d.overall_assessment === v ? (v === "SATISFACTORY" ? "#f0fdf4" : "#fef2f2") : "#f8fafc", color: d.overall_assessment === v ? (v === "SATISFACTORY" ? "#059669" : "#dc2626") : "#94a3b8", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{v}</button>
          ))}
        </div>
        <div>
          <label style={S.label}>Recommended date for next inspection</label>
          {selectedTemplate ? (
            <select style={{ ...S.input, background: "#f8fafc" }} value={d.next_inspection} onChange={e => set("next_inspection", e.target.value)}>
              <option value="">-- Select --</option>
              {selectedTemplate.next_inspection_options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input style={S.input} value={d.next_inspection} onChange={e => set("next_inspection", e.target.value)} placeholder="e.g. 5 Years or change of tenancy" />
          )}
        </div>
      </div>

      <button style={S.btn("primary")} onClick={() => onNext(d)}>Continue to Supply Details -></button>
      <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
    </div>
  );
}

// ---- SCREEN 2: SECTIONS 10-11 (Supply Characteristics & Particulars) ----
function EICRSupplyScreen({ job, initialData, onBack, onNext }) {
const [d, setD] = useState(initialData || {
  earthing_tncs:false, earthing_tns:false, earthing_tt:false,
  phases_1:true, phases_2:false, phases_3w:false, phases_3_4w:false,
  polarity_confirmed:false, phase_sequence_confirmed:false,
  voltage_uo:230, frequency:50,
  prospective_fault_current:"", external_ze:"",
  spd_bs:"", spd_type:"", spd_rating:"",
  main_switch_location:"", main_switch_bs:"", main_switch_poles:"",
  main_switch_rating:"", main_switch_fuse_setting:"", main_switch_voltage:"",
  rcd_main:false, rcd_type:"", rcd_idelta:"", rcd_delay:"", rcd_measured:"",
  earth_conductor_material:"Copper", earth_conductor_csa:"",earth_conductor_verified:false,
  bonding_conductor_material:"Copper", bonding_conductor_csa:"", bonding_conductor_verified:false,
  bond_water:false, bond_gas:false, bond_oil:false, bond_lightning:false, bond_steel:false,
  distributor_facility:false, installation_electrode:false,
  electrode_type:"", electrode_resistance:"", electrode_location:"", electrode_method:"",
  general_condition:"",
  test_mft:"", test_ir:"", test_continuity:"", test_electrode:"", test_loop:"", test_rcd:"",
});
const set = (k,v) => setD(x=>({...x,[k]:v}));

const Check = ({label,k}) => (
  <button onClick={()=>set(k,!d[k])} style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:"4px 0",fontFamily:"inherit"}}>
    <span style={{width:20,height:20,borderRadius:4,border:"2px solid",borderColor:d[k]?"#1e3a5f":"#cbd5e1",background:d[k]?"#1e3a5f":"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
      {d[k] && <span style={{color:"#fff",fontSize:12}}>✓</span>}
    </span>
    <span style={{fontSize:13,color:"#334155"}}>{label}</span>
  </button>
);

const Field = ({label,k,type="text",placeholder=""}) => (
  <div style={{marginBottom:10}}>
    <label style={S.label}>{label}</label>
    <input style={S.input} type={type} value={d[k]||""} placeholder={placeholder} onChange={e=>set(k,e.target.value)}/>
  </div>
);

return (
<div style={{padding:16}}>
  <div style={{fontSize:18,fontWeight:700,color:"#1e3a5f",marginBottom:16}}>Sections 10–11: Supply & Installation</div>

  {/* Section 10 */}
  <div style={{background:"#1e3a5f",color:"#fff",borderRadius:"8px 8px 0 0",padding:"8px 12px",fontSize:12,fontWeight:700}}>10 SUPPLY CHARACTERISTICS AND EARTHING ARRANGEMENTS</div>
  <div style={{border:"1.5px solid #1e3a5f",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"12px",marginBottom:12}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
      <div>
        <div style={S.label}>Earthing Arrangement</div>
        {[["earthing_tns","TN-S"],["earthing_tncs","TN-C-S"],["earthing_tt","TT"]].map(([k,l])=><Check key={k} label={l} k={k}/>)}
      </div>
      <div>
        <div style={S.label}>Number & Type of Live Conductors</div>
        {[["phases_1","1-phase (2-wire)"],["phases_2","2-phase (3-wire)"],["phases_3w","3-phase (3-wire)"],["phases_3_4w","3-phase (4-wire)"]].map(([k,l])=><Check key={k} label={l} k={k}/>)}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <Field label="Nominal Voltage UO (V)" k="voltage_uo" type="number"/>
      <Field label="Frequency (Hz)" k="frequency" type="number"/>
      <Field label="Prospective Fault Current Ipf (kA)" k="prospective_fault_current" placeholder="kA"/>
      <Field label="External Ze (Ω)" k="external_ze" placeholder="Ω"/>
    </div>
    <Check label="Confirmation of supply polarity" k="polarity_confirmed"/>
    <div style={{marginTop:8}}><Check label="Confirmation of phase sequence" k="phase_sequence_confirmed"/></div>

    <div style={{marginTop:12}}>
      <div style={S.label}>Supply Protective Device (BS EN)</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
        <div><label style={S.label}>BS (EN)</label><input style={S.input} value={d.spd_bs||""} onChange={e=>set("spd_bs",e.target.value)} placeholder="e.g. BS 1361"/></div>
        <div><label style={S.label}>Type</label><input style={S.input} value={d.spd_type||""} onChange={e=>set("spd_type",e.target.value)}/></div>
        <div><label style={S.label}>Rated Current (A)</label><input style={S.input} value={d.spd_rating||""} onChange={e=>set("spd_rating",e.target.value)}/></div>
      </div>
    </div>
  </div>

  {/* Section 11 */}
  <div style={{background:"#1e3a5f",color:"#fff",borderRadius:"8px 8px 0 0",padding:"8px 12px",fontSize:12,fontWeight:700}}>11 PARTICULARS OF INSTALLATION REFERRED TO IN THE REPORT</div>
  <div style={{border:"1.5px solid #1e3a5f",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"12px",marginBottom:12}}>
    <div style={{fontSize:12,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>Means of Earthing</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
      <Check label="Distributor's facility" k="distributor_facility"/>
      <Check label="Installation earth electrode" k="installation_electrode"/>
    </div>
    {d.installation_electrode && (
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
        <Field label="Electrode Type" k="electrode_type"/>
        <Field label="Resistance to Earth (Ω)" k="electrode_resistance"/>
        <Field label="Location" k="electrode_location"/>
        <Field label="Method of Measurement" k="electrode_method"/>
      </div>
    )}

    <div style={{fontSize:12,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>Main Switch / Switch-Fuse / Circuit-Breaker / RCD</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
      <Field label="Location" k="main_switch_location" placeholder="e.g. Hall cupboard"/>
      <Field label="BS (EN)" k="main_switch_bs" placeholder="e.g. 60947-3"/>
      <Field label="Number of Poles" k="main_switch_poles"/>
      <Field label="Current Rating (A)" k="main_switch_rating" type="number"/>
      <Field label="Fuse/Device Rating or Setting" k="main_switch_fuse_setting"/>
      <Field label="Voltage Rating (V)" k="main_switch_voltage" type="number"/>
    </div>
    <Check label="RCD main switch" k="rcd_main"/>
    {d.rcd_main && (
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:8}}>
        <Field label="RCD Type" k="rcd_type"/>
        <Field label="Rated Residual Operating Current IΔn (mA)" k="rcd_idelta"/>
        <Field label="Rated Time Delay (ms)" k="rcd_delay"/>
        <Field label="Measured Operating Time (ms)" k="rcd_measured"/>
      </div>
    )}

    <div style={{fontSize:12,fontWeight:700,color:"#1e3a5f",margin:"12px 0 8px"}}>Earthing and Protective Bonding Conductors</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:8}}>
      <div><label style={S.label}>Earthing Conductor Material</label><input style={S.input} value={d.earth_conductor_material||""} onChange={e=>set("earth_conductor_material",e.target.value)}/></div>
      <div><label style={S.label}>CSA (mm²)</label><input style={S.input} type="number" value={d.earth_conductor_csa||""} onChange={e=>set("earth_conductor_csa",e.target.value)}/></div>
      <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}><Check label="Connection verified" k="earth_conductor_verified"/></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:12}}>
      <div><label style={S.label}>Bonding Conductor Material</label><input style={S.input} value={d.bonding_conductor_material||""} onChange={e=>set("bonding_conductor_material",e.target.value)}/></div>
      <div><label style={S.label}>CSA (mm²)</label><input style={S.input} type="number" value={d.bonding_conductor_csa||""} onChange={e=>set("bonding_conductor_csa",e.target.value)}/></div>
      <div style={{display:"flex",flexDirection:"column",justifyContent:"flex-end"}}><Check label="Connection verified" k="bonding_conductor_verified"/></div>
    </div>

    <div style={{fontSize:12,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>Bonding of Extraneous-Conductive Parts</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      {[["bond_water","Water installation pipes"],["bond_gas","Gas installation pipes"],["bond_oil","Oil installation pipes"],["bond_lightning","Lightning protection"],["bond_steel","Structural steel"]].map(([k,l])=><Check key={k} label={l} k={k}/>)}
    </div>
  </div>

  {/* Section 8 - General Condition */}
  <div style={{background:"#1e3a5f",color:"#fff",borderRadius:"8px 8px 0 0",padding:"8px 12px",fontSize:12,fontWeight:700}}>8 GENERAL CONDITION OF THE INSTALLATION</div>
  <div style={{border:"1.5px solid #1e3a5f",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"12px",marginBottom:12}}>
    <textarea style={{...S.input,minHeight:100}} value={d.general_condition||""} onChange={e=>set("general_condition",e.target.value)} placeholder="General condition of the installation in terms of electrical safety..."/>
  </div>

  {/* Test Instruments */}
  <div style={{background:"#1e3a5f",color:"#fff",borderRadius:"8px 8px 0 0",padding:"8px 12px",fontSize:12,fontWeight:700}}>DETAILS OF TEST INSTRUMENTS</div>
  <div style={{border:"1.5px solid #1e3a5f",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"12px",marginBottom:16}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      {[["Multi-functional","test_mft"],["Insulation resistance","test_ir"],["Continuity","test_continuity"],["Earth electrode resistance","test_electrode"],["Earth fault loop impedance","test_loop"],["RCD","test_rcd"]].map(([l,k])=>(
        <div key={k}><label style={S.label}>{l}</label><input style={S.input} value={d[k]||""} onChange={e=>set(k,e.target.value)} placeholder="Serial/Asset No."/></div>
      ))}
    </div>
  </div>

  <button style={S.btn("primary")} onClick={()=>onNext(d)}>Continue to DB & Circuits -></button>
  <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
</div>
);
}

// ---- SCREEN 3: DISTRIBUTION BOARD & CIRCUITS ----
function EICRCircuitScreen({ job, initialData, onBack, onNext }) {
const [db, setDb] = useState(initialData?.db || {
  reference:"DB 1", location:"", supplied_from:"Origin",
  ocpd_bs:"", ocpd_type:"", ocpd_rating:"", ocpd_phases:1,
  spd_t1:false, spd_t2:false, spd_t3:false, spd_status:false,
  polarity_confirmed:false, phase_sequence_confirmed:false,
  zs_at_db:"", ipf_at_db:"",
});
const [circuits, setCircuits] = useState(initialData?.circuits || []);
const [editing, setEditing] = useState(null);
const [form, setForm] = useState(null);
const setDB = (k,v) => setDb(x=>({...x,[k]:v}));

const blankCircuit = () => ({
  number: String(circuits.length+1),
  description:"",
  wiring_type:"A",
  reference_method:"C",
  points_served:"",
  live_size:"2.5",
  cpc_size:"1.5",
  max_disconnect:"0.4",
  ocpd_bs:"60898",
  ocpd_type:"B",
  ocpd_rating:"32",
  breaking_cap:"6",
  max_permitted_zs:"",
  rcd_bs:"61008",
  rcd_type:"AC",
  rcd_rating:"30",
  rcd_rating_a:"",
  r1_line:"", rn_neutral:"", r2_cpc:"", r1_r2:"", cont_r1r2_r2:"", cont_r2:"",
  test_voltage:"500",
  ir_live_live:"", ir_live_earth:"", ir_neutral_earth:"",
  polarity:false,
  max_measured_zs:"",
  disconnection_time:"",
  rcd_test_ok:false,
  afdd_ok:false,
  notes:"",
});

const openNew = () => { setForm(blankCircuit()); setEditing("new"); };
const openEdit = (i) => { setForm({...circuits[i]}); setEditing(i); };
const setF = (k,v) => setForm(f=>({...f,[k]:v}));

const saveCircuit = () => {
  if(editing==="new") setCircuits(c=>[...c,form]);
  else setCircuits(c=>c.map((x,i)=>i===editing?form:x));
  setEditing(null); setForm(null);
};

const WIRING_CODES = ["A","B","C","D","E","F","G","H"];

if(form) return (
<div style={{padding:16}}>
  <div style={{fontSize:16,fontWeight:700,color:"#1e3a5f",marginBottom:12}}>Circuit {form.number} — {form.description||"New Circuit"}</div>

  <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
    <div style={{fontSize:11,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>CIRCUIT DETAILS</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      {[["No.","number"],["Description","description"]].map(([l,k])=>(
        <div key={k}><label style={S.label}>{l}</label><input style={S.input} value={form[k]||""} onChange={e=>setF(k,e.target.value)}/></div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
      <div><label style={S.label}>Wiring Type</label>
        <select style={{...S.input,background:"#f8fafc"}} value={form.wiring_type} onChange={e=>setF("wiring_type",e.target.value)}>
          {WIRING_CODES.map(c=><option key={c}>{c}</option>)}
        </select>
      </div>
      <div><label style={S.label}>Ref Method</label><input style={S.input} value={form.reference_method||""} onChange={e=>setF("reference_method",e.target.value)}/></div>
      <div><label style={S.label}>Points</label><input style={S.input} value={form.points_served||""} onChange={e=>setF("points_served",e.target.value)}/></div>
      <div><label style={S.label}>Max disc (s)</label><input style={S.input} value={form.max_disconnect||""} onChange={e=>setF("max_disconnect",e.target.value)}/></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <div><label style={S.label}>Live (mm²)</label><input style={S.input} value={form.live_size||""} onChange={e=>setF("live_size",e.target.value)}/></div>
      <div><label style={S.label}>CPC (mm²)</label><input style={S.input} value={form.cpc_size||""} onChange={e=>setF("cpc_size",e.target.value)}/></div>
    </div>
  </div>

  <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
    <div style={{fontSize:11,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>OVERCURRENT PROTECTIVE DEVICE</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
      <div><label style={S.label}>BS (EN)</label><input style={S.input} value={form.ocpd_bs||""} onChange={e=>setF("ocpd_bs",e.target.value)}/></div>
      <div><label style={S.label}>Type</label><input style={S.input} value={form.ocpd_type||""} onChange={e=>setF("ocpd_type",e.target.value)}/></div>
      <div><label style={S.label}>Rating (A)</label><input style={S.input} value={form.ocpd_rating||""} onChange={e=>setF("ocpd_rating",e.target.value)}/></div>
      <div><label style={S.label}>Breaking (kA)</label><input style={S.input} value={form.breaking_cap||""} onChange={e=>setF("breaking_cap",e.target.value)}/></div>
    </div>
    <div><label style={S.label}>Maximum Permitted Zs (Ω)</label><input style={S.input} value={form.max_permitted_zs||""} onChange={e=>setF("max_permitted_zs",e.target.value)} placeholder="From BS 7671 tables"/></div>
  </div>

  <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
    <div style={{fontSize:11,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>RCD</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
      <div><label style={S.label}>BS (EN)</label><input style={S.input} value={form.rcd_bs||""} onChange={e=>setF("rcd_bs",e.target.value)}/></div>
      <div><label style={S.label}>Type</label><input style={S.input} value={form.rcd_type||""} onChange={e=>setF("rcd_type",e.target.value)}/></div>
      <div><label style={S.label}>IΔn (mA)</label><input style={S.input} value={form.rcd_rating||""} onChange={e=>setF("rcd_rating",e.target.value)}/></div>
      <div><label style={S.label}>Rating (A)</label><input style={S.input} value={form.rcd_rating_a||""} onChange={e=>setF("rcd_rating_a",e.target.value)}/></div>
    </div>
  </div>

  <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
    <div style={{fontSize:11,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>CONTINUITY (Ω)</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
      {[["r1 line","r1_line"],["rn neutral","rn_neutral"],["r2 cpc","r2_cpc"],["R1+R2","r1_r2"],["R1+R2 or R2","cont_r1r2_r2"],["R2","cont_r2"]].map(([l,k])=>(
        <div key={k}><label style={S.label}>{l}</label><input style={S.input} type="number" step="0.01" value={form[k]||""} onChange={e=>setF(k,e.target.value)}/></div>
      ))}
    </div>
  </div>

  <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
    <div style={{fontSize:11,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>INSULATION RESISTANCE (MΩ)</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <div><label style={S.label}>Test Voltage (V)</label><input style={S.input} value={form.test_voltage||""} onChange={e=>setF("test_voltage",e.target.value)}/></div>
      <div></div>
      {[["Live–Live","ir_live_live"],["Live–Earth","ir_live_earth"],["Neutral–Earth","ir_neutral_earth"]].map(([l,k])=>(
        <div key={k}><label style={S.label}>{l} (MΩ)</label><input style={S.input} type="number" step="0.01" value={form[k]||""} onChange={e=>setF(k,e.target.value)}/></div>
      ))}
    </div>
  </div>

  <div style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
    <div style={{fontSize:11,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>ZS & RCD TEST</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      <div><label style={S.label}>Max Measured Zs (Ω)</label><input style={S.input} type="number" step="0.01" value={form.max_measured_zs||""} onChange={e=>setF("max_measured_zs",e.target.value)}/></div>
      <div><label style={S.label}>Disconnection Time (ms)</label><input style={S.input} type="number" value={form.disconnection_time||""} onChange={e=>setF("disconnection_time",e.target.value)}/></div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8}}>
      {[["Polarity ✓","polarity"],["RCD Test ✓","rcd_test_ok"],["AFDD Test ✓","afdd_ok"]].map(([l,k])=>(
        <button key={k} onClick={()=>setF(k,!form[k])} style={{padding:"10px 6px",borderRadius:8,border:"2px solid",borderColor:form[k]?"#059669":"#e2e8f0",background:form[k]?"#f0fdf4":"#f8fafc",color:form[k]?"#059669":"#94a3b8",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{form[k]?"✓ "+l:l}</button>
      ))}
    </div>
  </div>

  <div style={{marginBottom:12}}><label style={S.label}>Notes</label><textarea style={{...S.input,minHeight:50}} value={form.notes||""} onChange={e=>setF("notes",e.target.value)}/></div>

  <button style={S.btn("primary")} onClick={saveCircuit}>Save Circuit</button>
  <button style={S.btn("ghost")} onClick={()=>{setEditing(null);setForm(null);}}>Cancel</button>
</div>
);

return (
<div style={{padding:16}}>
  {/* DB Details */}
  <div style={{background:"#1e3a5f",color:"#fff",borderRadius:"8px 8px 0 0",padding:"8px 12px",fontSize:12,fontWeight:700}}>DISTRIBUTION BOARD DETAILS</div>
  <div style={{border:"1.5px solid #1e3a5f",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"12px",marginBottom:12}}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
      {[["DB Reference","reference"],["Location","location"],["Supplied From","supplied_from"]].map(([l,k])=>(
        <div key={k}><label style={S.label}>{l}</label><input style={S.input} value={db[k]||""} onChange={e=>setDB(k,e.target.value)}/></div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
      {[["OCPD BS(EN)","ocpd_bs"],["Type","ocpd_type"],["Rating/Setting","ocpd_rating"],["No. Phases","ocpd_phases"]].map(([l,k])=>(
        <div key={k}><label style={S.label}>{l}</label><input style={S.input} value={db[k]||""} onChange={e=>setDB(k,e.target.value)}/></div>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      {[["Zs at DB (Ω)","zs_at_db"],["Ipf at DB (kA)","ipf_at_db"]].map(([l,k])=>(
        <div key={k}><label style={S.label}>{l}</label><input style={S.input} value={db[k]||""} onChange={e=>setDB(k,e.target.value)}/></div>
      ))}
    </div>
  </div>

  {/* Circuits */}
  <div style={{fontSize:14,fontWeight:700,color:"#1e3a5f",marginBottom:8}}>Circuit Schedule — {circuits.length} circuit{circuits.length!==1?"s":""}</div>
  {circuits.map((c,i)=>(
    <div key={i} onClick={()=>openEdit(i)} style={{background:"#fff",border:"1.5px solid #e2e8f0",borderRadius:10,padding:"10px 12px",marginBottom:6,cursor:"pointer"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <span style={{fontSize:11,fontWeight:700,color:"#fff",background:"#1e3a5f",padding:"2px 8px",borderRadius:4,marginRight:8}}>{c.number}</span>
          <span style={{fontSize:13,fontWeight:600,color:"#1e3a5f"}}>{c.description||"Unnamed"}</span>
        </div>
        <button onClick={e=>{e.stopPropagation();setCircuits(c=>c.filter((_,idx)=>idx!==i));}} style={{background:"none",border:"none",color:"#94a3b8",fontSize:18,cursor:"pointer"}}>×</button>
      </div>
      <div style={{display:"flex",gap:10,marginTop:4,flexWrap:"wrap"}}>
        <span style={{fontSize:11,color:"#64748b"}}>Type {c.wiring_type} | {c.ocpd_type} {c.ocpd_rating}A</span>
        {c.max_measured_zs && <span style={{fontSize:11,color:"#64748b"}}>Zs: {c.max_measured_zs}Ω</span>}
        {c.ir_live_earth && <span style={{fontSize:11,color:"#64748b"}}>IR L-E: {c.ir_live_earth}MΩ</span>}
        {c.polarity && <span style={{fontSize:11,color:"#059669",fontWeight:700}}>✓ Polarity</span>}
        {c.rcd_test_ok && <span style={{fontSize:11,color:"#059669",fontWeight:700}}>✓ RCD</span>}
      </div>
    </div>
  ))}

  <button style={{...S.btn("primary"),marginBottom:8}} onClick={openNew}>+ Add Circuit</button>
  <button style={S.btn("primary")} onClick={()=>onNext({db, circuits})}>Continue to Inspection Schedule -></button>
  <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
</div>
);
}

// ---- SCREEN 4: SECTION 12 — INSPECTION SCHEDULE ----
function EICRInspectionScreen({ job, initialData, onBack, onNext }) {
const [answers, setAnswers] = useState(initialData || {});
const [expanded, setExpanded] = useState("intake");
const setAns = (id,v) => setAnswers(a=>({...a,[id]:{...a[id],answer:v}}));
const setNote = (id,v) => setAnswers(a=>({...a,[id]:{...a[id],note:v}}));

const totalItems = EICR_SECTIONS.reduce((n,s)=>n+s.items.length,0);
const answered = Object.keys(answers).filter(k=>answers[k]?.answer).length;

const outcomeColor = {pass:"#059669",c1:"#dc2626",c2:"#ea580c",c3:"#d97706",fi:"#7c3aed",lim:"#0284c7",nv:"#64748b",na:"#94a3b8"};

return (
<div style={{padding:16}}>
  <div style={{background:"#1e3a5f",color:"#fff",borderRadius:"8px 8px 0 0",padding:"8px 12px",fontSize:12,fontWeight:700}}>12 INSPECTION SCHEDULE FOR DOMESTIC & SIMILAR PREMISES WITH UP TO 100A SUPPLY</div>
  <div style={{border:"1.5px solid #1e3a5f",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"12px",marginBottom:12}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
      <span style={{fontSize:12,color:"#64748b"}}>{answered}/{totalItems} items</span>
      <span style={{fontSize:11,color:"#64748b"}}>PASS | C1 | C2 | C3 | FI | LIM | N/V | N/A</span>
    </div>
    <div style={{background:"#e2e8f0",borderRadius:4,height:4,marginBottom:12}}>
      <div style={{background:"#1e3a5f",height:4,borderRadius:4,width:`${answered/totalItems*100}%`,transition:"width 0.3s"}}/>
    </div>

    {EICR_SECTIONS.map(section=>(
      <div key={section.id} style={{marginBottom:6,border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
        <button onClick={()=>setExpanded(expanded===section.id?null:section.id)}
          style={{width:"100%",padding:"10px 12px",background:expanded===section.id?"#1e3a5f":"#f8fafc",border:"none",textAlign:"left",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"inherit"}}>
          <span style={{fontSize:12,fontWeight:700,color:expanded===section.id?"#fff":"#1e3a5f"}}>{section.label}</span>
          <span style={{fontSize:10,color:expanded===section.id?"rgba(255,255,255,0.7)":"#94a3b8"}}>
            {section.items.filter(i=>answers[i.id]?.answer).length}/{section.items.length}
          </span>
        </button>
        {expanded===section.id && (
          <div style={{padding:"8px 12px 12px"}}>
            {section.note && <div style={{fontSize:11,color:"#d97706",background:"#fffbeb",border:"1px solid #fde68a",borderRadius:6,padding:"6px 10px",marginBottom:8}}>{section.note}</div>}
            {section.items.map(item=>{
              const ans = answers[item.id]?.answer;
              const note = answers[item.id]?.note||"";
              return (
                <div key={item.id} style={{marginBottom:8,paddingBottom:8,borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
                    <span style={{fontSize:11,fontWeight:700,color:"#94a3b8",minWidth:32}}>{item.id}</span>
                    <span style={{fontSize:12,color:"#334155",flex:1,lineHeight:1.4}}>{item.q}</span>
                    {ans && <span style={{fontSize:11,fontWeight:700,color:outcomeColor[ans]||"#64748b",marginLeft:8,minWidth:32,textAlign:"right"}}>{ans.toUpperCase()}</span>}
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginLeft:32}}>
                    {EICR_OUTCOMES.map(opt=>(
                      <button key={opt.v} onClick={()=>setAns(item.id,opt.v)}
                        style={{padding:"4px 8px",borderRadius:4,border:"1.5px solid",borderColor:ans===opt.v?opt.col:"#e2e8f0",background:ans===opt.v?opt.bg:"#fff",color:ans===opt.v?opt.col:"#94a3b8",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>
                        {opt.l}
                      </button>
                    ))}
                  </div>
                  {ans && ans!=="na" && ans!=="pass" && ans!=="nv" && (
                    <input style={{...S.input,marginBottom:0,fontSize:11,marginTop:4,marginLeft:32}} value={note} onChange={e=>setNote(item.id,e.target.value)} placeholder="Note / observation reference..."/>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    ))}
  </div>
  <button style={S.btn("primary")} onClick={()=>onNext(answers)}>Continue to Observations -></button>
  <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
</div>
);
}

const EICR_OBS_LIBRARY = [
  { section: "1.0 Intake Equipment", items: [
    { text: "Service cable shows signs of overheating (ESQCR)", code: "C3" },
    { text: "Service cable not adequately supported (ESQCR)", code: "C3" },
    { text: "Cables have signs of scorching (ESQCR)", code: "C3" },
    { text: "Service head shows signs of tar residue (ESQCR)", code: "C3" },
    { text: "Service cut-out fuse carrier seal not properly secure (ESQCR)", code: "C3" },
    { text: "Service cut-out has been damaged (ESQCR)", code: "C3" },
    { text: "Service cut-out has double pole fuses (ESQCR)", code: "C3" },
    { text: "Neutral connection has exposed parts (ESQCR)", code: "C3" },
    { text: "Service cut out underrated for installation (ESQCR)", code: "C3" },
    { text: "Earthing conductor connects to single connection with other protective conductors (132.10526.2)", code: "C3" },
    { text: "The earthing conductor termination to supply shows signs of corrosion (ESQCR)", code: "C3" },
    { text: "Service cable earth connection not secure (ESQCR)", code: "C3" },
    { text: "Incorrect connection of earthing conductor to TN-S service cable (ESQCR)", code: "C3" },
    { text: "Meter tails not adequately supported (ESQCR)", code: "C3" },
    { text: "Meter tails have not been provided with an outer sheath or other means of protecting conductors - not accessible without use of key(ESQCR)", code: "C3" },
    { text: "Meter equipment has been damaged (ESQCR)", code: "C3" },
    { text: "Overheating of metering equipment (ESQCR)", code: "C3" },
    { text: "External meter enclosure subject to damage (ESQCR)", code: "C3" },
    { text: "Meter terminal access plate not securely sealed (ESQCR)", code: "C3" },
    { text: "Supplier side isolator not securely sealed (ESQCR)", code: "C3" },
    { text: "The isolator enclosure has live exposed parts (ESQCR)", code: "C3" },
    { text: "Isolator has not been provided with identification (ESQCR)", code: "C3" },
    { text: "Isolator has not been provided with identification (514.11.1)", code: "C3" },
    { text: "The isolator enclosure has live exposed parts (416.1)", code: "C3" },
    { text: "No external isolator to DB", code: "C3" },
    { text: "Meter tails bending radius, tighter than acceptable levels, no signs of thermal damage - No safety concerns (522.8.3)", code: "C3" },
    { text: "Meter tails have not been adequately supported (522.8.5)", code: "C3" },
    { text: "Meter tails exceed 3 meters in length no fused isolator in place(433.2.2)", code: "C3" },
    { text: "Consumer supply conductors (meter tails) 16 mm where protective device is unknown. No evidence of thermal damage or overload and considered safe for continued use. (433.1.1)", code: "C3" },
    { text: "Meter tails have not been provided with an outer sheath or other means of protecting conductors - not accessible without use of key(ESQCR)", code: "C3" },
  ]},
  { section: "2.0 Microgenerators", items: [
    { text: "No warning notice informing of other sources of supply", code: "C3" },
    { text: "No local isolation to isolate supply from public supply", code: "C3" },
  ]},
  { section: "3.0 Earthing & Bonding", items: [
    { text: "Main earth terminal not provided (542.4.4)", code: "C3" },
    { text: "Earth electrode termination has not been installed in a suitable enclosure (514.3.2)", code: "C3" },
    { text: "Earth electrode termination has not been provided with a label (514.1.2)", code: "C3" },
    { text: "Earth conductor 10mm showing no signs of thermal effects. Adiabatic equation carried out safe for continued use, (543.1.3)", code: "C3" },
    { text: "Earth conductor 6mm showing no signs of thermal effects. Adiabatic equation carried out safe for continued use, (543.1.3)", code: "C3" },
    { text: "Main earth terminal poor connections - No safety concerns (542.3.2)", code: "C3" },
    { text: "No means of disconnection of earthing conductor, by means of a tool (542.4.2)", code: "C3" },
    { text: "The main earth terminal is not accessible at the intake position (543.3.2)", code: "C3" },
    { text: "The main protective bonding to the installation pipe(s) (water/gas/etc.) is a 6mm conductor, with no signs of thermal damage. Adiabatic equation carried out safe for continued use (544.1.1)", code: "C3" },
    { text: "Unable to determine the bonding conductor cross-sectional area. (544.1.1)", code: "C3" },
    { text: "The cross-sectional area for the main protective bonding conductor does not meet the minimum requirements. (544.1.1)", code: "C3" },
    { text: "Main protective Gas bonding conductor connection not accessible - test method 2 (between the protective conductor disconnected at met and accessible part of pipe work) confirms connection. (543.3.2)", code: "C3" },
    { text: "Main protective Water bonding conductor connection not accessible - test method 2 (between the protective conductor disconnected at met and accessible part of pipe work) confirms connection. (543.3.2)", code: "C3" },
    { text: "Main protective Gas conductor not continuous (jointed) readings shows safe for continued use (528.3.3)", code: "C3" },
    { text: "Main protective Water conductor not continuous (jointed) readings shows safe for continued use (528.3.3)", code: "C3" },
    { text: "The main protective bonding conductor has not been connected within 600mm to the incoming installation pipe(s) (water/gas/etc.) at the point of entry to the premises/metering equipment (411.3.1.2/544.1.2)", code: "C3" },
    { text: "Main protective bonding connection made with inappropriate termination. (526.1)", code: "C3" },
    { text: "Earthing connection 'Safety electrical connection do not remove' label not provided. (514.13.1)", code: "C3" },
    { text: "Earthing conductors not identified (514.4.2)", code: "C3" },
    { text: "The bonding connection has not been provided with a label (514.1.2/514.13.1)", code: "C3" },
    { text: "Insufficient segregation from LV circuits", code: "C3" },
    { text: "Lack of clear identification of FELV circuits", code: "C3" },
    { text: "No protective earth connection where required", code: "C3" },
    { text: "Inadequate insulation or mechanical protection", code: "C3" },
    { text: "Separation transformer not to BS EN standard or incorrectly installed", code: "C3" },
    { text: "Missing documentation or labels indicating \"double-insulated only\"", code: "C3" },
    { text: "Missing documentation or risk assessment for Reg. 419 application", code: "C3" },
  ]},
  { section: "4.0 Consumer Unit / Distribution Board", items: [
    { text: "The DB mounted at a height which prevents ease of access for user (513.1)", code: "C3" },
    { text: "The DB has restricted access due to cupboard/storage materials (132.12/513.1)", code: "C3" },
    { text: "DB cover not provided with manufacturers fixings (123.1.1)", code: "C3" },
    { text: "DB not fixed solidly to supporting structure, unlikely to fall (133.3/134.1.1)", code: "C3" },
    { text: "Clip in blank plate fitted to DB (complying with BS EN 60/61439-3) is not secured with sufficient stability and durability - but no access to live parts. (113.1/134.1.1/416.2.3)", code: "C3" },
    { text: "DB not installed suitable for properties historically affected by flooding. (522)", code: "C3" },
    { text: "CU/DB in a domestic household premises is not metal or installed in a non combustible cabinet, showing no signs of thermal damage, located under a wooden staircase or sole means of escape.(412.1.201)", code: "C3" },
    { text: "The DB/CU has excessive hole in the rear of the enclosure fixed to a standard material surface and has no signs of thermal damage. (527.1.1)", code: "C3" },
    { text: "The DB/CU has a crack in the protective device access flap (651.2)", code: "C3" },
    { text: "The main switch has not been properly mounted, loose, no signs of thermal damage - No safety concerns.(643.10)", code: "C3" },
    { text: "Isolator for Solar PV inverter, not securely mounted - loose fixings. (643.10)", code: "C3" },
    { text: "The neutral conductor has not been provided with isolation where a single pole RCD has been used as the main switch (462.1.201)", code: "C3" },
    { text: "The main switch does not provide isolation of the installation (643.10)", code: "C3" },
    { text: "The RCD manual test button failed to operate (643.10)", code: "C3" },
    { text: "The AFDD manual test button failed to operate (643.10)", code: "C3" },
    { text: "The circuit-breaker does not provide isolation of circuit (643.10)", code: "C3" },
    { text: "The RCD manual test button failed to operate (643.10)", code: "C3" },
    { text: "Selectivity not achieved with series-connected RCD - No safety concerns (531.3.2/536.4.1.4)", code: "C3" },
    { text: "Type AC RCD providing fault and/ or additional protection where an appliance or equipment could foreseeably be connected that requires the installation of a Type A, F or B RCD. (531.3.3)", code: "C3" },
    { text: "Type AC RCD providing fault and/ or additional protection where an appliance or equipment could foreseeably be connected that requires the installation of a Type A, F or B RCD. (531.3.3)", code: "C3" },
    { text: "There is no RCD test label present (514.12.2)", code: "C3" },
    { text: "No AFDD present for building that meets requirements stated in BS7671 (421.1.7)", code: "C3" },
    { text: "There is no alternative supply installation warning label present (514.15.1)", code: "C3" },
    { text: "There is no DB/CU ID label where more than one DB/CU is present (514.9)", code: "C3" },
    { text: "The source of isolation has not been identified on DB/CU (514.9)", code: "C3" },
    { text: "Installation has more than one supply - No warning label (514.11.1)", code: "C3" },
    { text: "Absence of label for SPD fitted within the installation (514.16.1)", code: "C3" },
    { text: "Devices fitted to DB/CU may not be compatible with original manufacturer's equipment - No signs of thermal damage - No safety concerns. (536.4.203)", code: "C3" },
    { text: "RCD has not been selected appropriately for diversity, taking account of possible circuit loadings, and is not equal to or greater than its main supply OCPD rated current - No signs of overheating or thermal damage - No safety concerns (536.4.202)", code: "C3" },
    { text: "Isolator has not been selected appropriately for diversity, taking account of possible circuit loadings, and is not equal to or greater than its main supply OCPD rated current - No signs of overheating or thermal damage - No safety concerns (522/536.4.202)", code: "C3" },
    { text: "Old DB/CU has fusing of both line and neutral conductors (132.14.1/530.3.3))", code: "C3" },
    { text: "The conductors have not been protected against strain on the terminations (526.1/522.8.5)", code: "C3" },
    { text: "Insufficient Mechanical protection where cables enter a consumer unit. (522.8.1; 522.8.5; 522.8.11) . Inspected cables, no evidence of damage or thermal effects - No safety concerns.", code: "C3" },
    { text: "The Line and Neutral DB/CU tails have been installed through different points of entry in the metal enclosure - no signs of overheating - No safety concerns. (521.5.1)", code: "C3" },
    { text: "The Line and Neutral DB/CU tails have been installed through different points of entry to the earthing conductor in the metal enclosure - no signs of overheating - No safety concerns. (521.5.1)", code: "C3" },
    { text: "No SPD provided for protection against transient overvoltage.(443.4)", code: "C3" },
    { text: "SPD status indicator showing device is no longer providing overvoltage protection - No life safety circuits at property - safe for continued use.", code: "C3" },
    { text: "Cable terminations at terminals, not correctly oriented - (526.1)", code: "C3" },
    { text: "Method of connection is not compatible with the number/shape/csa of conductors being connected/joined - No signs of thermal damage safe for continued use. (526.2)", code: "C3" },
  ]},
  { section: "5.0 Final Circuits", items: [
    { text: "Line conductor incorrectly identified", code: "C3" },
    { text: "Neutral conductor incorrectly identified", code: "C3" },
    { text: "Cables installed without means of support from premature collapse in case of an emergency, but not likely to cause a hazard. (521.10.202)", code: "C3" },
    { text: "Insulation to live conductors shows signs of age‑related deterioration - safe for continued use", code: "C3" },
    { text: "Containment systems are heavily populated and near capacity", code: "C3" },
    { text: "Containment systems are not ideally suited to environmental conditions.", code: "C3" },
    { text: "Cable terminations at terminals, not correctly oriented - (526.1)", code: "C3" },
    { text: "Method of connection is not compatible with the number/shape/csa of conductors being connected/joined - No signs of thermal damage safe for continued use. (526.2)", code: "C3" },
    { text: "Unsupported cables in lofts, resting on insulation but not under tension or damaged", code: "C3" },
    { text: "The loading of the distribution circuit exceeds the current carrying capacity of the cable due to the addition of thermal insulation - no evidence of thermal damage/ overload. - safe for continued use. (523.9)", code: "C3" },
    { text: "Type B MCB installed on a circuit likely to experience higher inrush currents (e.g. motor, transformer, some lighting).", code: "C3" },
    { text: "CPC present but conductor size does not meet current BS 7671 requirements - tested and all readings are correct for continued use.", code: "C3" },
    { text: "Protective device rating marginally exceeds conductor capacity - No signs of thermal damage/overloading - safe for continued use.", code: "C3" },
    { text: "Cables run close to heat sources (e.g. hot water pipes, boilers) without insulation or separation.", code: "C3" },
    { text: "Cable exposed to direct sunlight/ external elements, not of suitable type - no signs of thermal damage or deuteriation  - safe for continued use.. (522.1.1)", code: "C3" },
    { text: "ELV cables not insulated to LV standards when mixed.", code: "C3" },
    { text: "Cables have been secured to pipework (528.3)", code: "C3" },
    { text: "Covers of accessories in place but not adequately secured such as securing loose screw - tool needed for removal - safe for continued use. (134.1.1)", code: "C3" },
    { text: "External Accessories Showing Early Signs of Weathering slightly discoloured/ aged, seals intact, no signs of water ingress.", code: "C3" },
    { text: "Single‑pole isolation provided; double‑pole isolation now recommended.", code: "C3" },
    { text: "Multiple conductors terminated in accessories not designed for this arrangement. - Safe for continued use.", code: "C3" },
    { text: "Isolation device present but not readily accessible", code: "C3" },
    { text: "Isolation and switching devices are not clearly labelled.", code: "C3" },
    { text: "Isolation device is not capable of being locked off.", code: "C3" },
    { text: "Cable insulation temperature rating may be inadequate for the ambient conditions", code: "C3" },
  ]},
  { section: "6.0 General", items: [
    { text: "Line conductor incorrectly identified", code: "C3" },
    { text: "Neutral conductor incorrectly identified", code: "C3" },
    { text: "Cables installed without means of support from premature collapse in case of an emergency, but not likely to cause a hazard. (521.10.202)", code: "C3" },
    { text: "Insulation to live conductors shows signs of age‑related deterioration - safe for continued use", code: "C3" },
  ]},
  { section: "6.4 Bathrooms & Shower Rooms", items: [
    { text: "Containment systems are heavily populated and near capacity", code: "C3" },
    { text: "Containment systems are not ideally suited to environmental conditions.", code: "C3" },
    { text: "The loading of multiple circuits exceeds the current carrying capacity of the cable due to the addition of thermal insulation - no evidence of thermal damage/ overload. - safe for continued use. (523.9)", code: "C3" },
    { text: "The loading of sockets circuits exceeds the current carrying capacity of the cable due to the addition of thermal insulation - no evidence of thermal damage/ overload  - safe for continued use.. (523.9)", code: "C3" },
    { text: "The loading of cooker circuits exceeds the current carrying capacity of the cable due to the addition of thermal insulation - no evidence of thermal damage/ overload  - safe for continued use.. (523.9)", code: "C3" },
    { text: "The loading of shower circuits exceeds the current carrying capacity of the cable due to the addition of thermal insulation - no evidence of thermal damage/ overload  - safe for continued use.. (523.9)", code: "C3" },
    { text: "Type B MCB installed on a circuit likely to experience higher inrush currents (e.g. motor, transformer, some lighting).", code: "C3" },
    { text: "There is no circuit protective conductor installed on a lighting circuit with all class 2 fittings and accessories fitted  - safe for continued use..(411.3.1.1)", code: "C3" },
    { text: "No fly earth to back box for CPC, does not have 1 fixed lug and has a class 1 face plate installed  - safe for continued use.. (411.4.2)", code: "C3" },
    { text: "CPC present but conductor size does not meet current BS 7671 requirements - tested and all readings are correct for continued use.", code: "C3" },
    { text: "2.5mm ring final circuit with a 1.0mm circuit protective conductor(s). (543.1.1)", code: "C3" },
    { text: "Protective device rating marginally exceeds conductor capacity - No signs of thermal damage/overloading - safe for continued use.", code: "C3" },
    { text: "Extension leads have been utilised due to insufficient number of sockets. (553.1.7)", code: "C3" },
    { text: "Socket outlet installed to low - damage to plug/lead may happen (553.1.6)", code: "C3" },
    { text: "Wiring system inappropriately installed, due to poor workmanship - safe for continued use.", code: "C3" },
    { text: "Unsupported cables in lofts, resting on insulation but not under tension or damaged", code: "C3" },
    { text: "Cables run close to heat sources (e.g. hot water pipes, boilers) without insulation or separation.", code: "C3" },
    { text: "Cable exposed to direct sunlight/ external elements, not of suitable type - no signs of thermal damage or deterioration  - safe for continued use.. (522.1.1)", code: "C3" },
  ]},
  { section: "6.13 EV Charging", items: [
    { text: "Socket outlets not protected by RCD to be used by ordinary persons - cannot be used to supply outdoor equipment - safe for continued use. (411.3.3(i))", code: "C3" },
    { text: "RCD mot provided for mobile equipment for use outdoors (411.3.3(ii))", code: "C3" },
    { text: "Cable concealed in a wall at depth of less then 50mm not protected by a 30 mA RCD. ( 522.6.6)", code: "C3" },
    { text: "Luminaires within a domestic property without 30ma RCD protection where circuit does not supply a special location(411.3.4)", code: "C3" },
    { text: "No non-combustible hoods fitted on open back downlights. (527.1.2)", code: "C3" },
    { text: "ELV cables not insulated to LV standards when mixed.", code: "C3" },
    { text: "Doorbell transform in consumer unit band ll cables not separated.", code: "C3" },
    { text: "Cables have been secured to pipework (528.3)", code: "C3" },
    { text: "Gas not segregated or 150mm from consumer unit.", code: "C3" },
  ]},
  { section: "6.17 Solar PV", items: [
    { text: "Cables have been jointed in trunking without being enclosed junction box (526.5)", code: "C3" },
    { text: "Covers of accessories in place but not adequately secured such as securing loose screw - tool needed for removal - safe for continued use. (134.1.1)", code: "C3" },
    { text: "Socket outlet is less than 100m horizontally from a cooker/hob - No signs of thermal damage - safe for continued use. (512.2)", code: "C3" },
    { text: "Socket outlet is less than 300m horizontally from a sink/basin - No signs of water damage - safe for continued use. (512.2)", code: "C3" },
    { text: "External Accessories Showing Early Signs of Weathering slightly discoloured/ aged, seals intact, no signs of water ingress.", code: "C3" },
    { text: "Isolation device present but not readily accessible", code: "C3" },
    { text: "Single‑pole isolation provided; double‑pole isolation now recommended.", code: "C3" },
  ]},
  { section: "7.0 Special Locations", items: [
    { text: "Isolator not local to fixed equipment", code: "C3" },
    { text: "Only point of isolation is at origin of circuit", code: "C3" },
    { text: "Isolator not local to fixed equipment/ has visible  label to indicate circuit use.", code: "C3" },
    { text: "Isolator not local to fixed equipment/ has visible  label to indicate circuit use.", code: "C3" },
  ]},
  { section: "7.3 Agricultural / Horticultural", items: [
    { text: "Opening behind light fixture not sealed to prevent risk stated.", code: "C3" },
  ]},
  { section: "9.0 Additional", items: [
    { text: "Shower isolator in Zone 2, is less than 2.25m showing no signs of water ingress (701.512.2)", code: "C3" },
  ]},
];

// ---- SCREEN 5: SECTION 7 — OBSERVATIONS ----
function EICRObservationsScreen({ job, initialData, onBack, onNext }) {
const [observations, setObservations] = useState(initialData || []);
const [editing, setEditing] = useState(null);
const [form, setForm] = useState(null);
const [showLibrary, setShowLibrary] = useState(false);
const [librarySearch, setLibrarySearch] = useState("");
const [librarySection, setLibrarySection] = useState("all");

const blankObs = () => ({item_no: String(observations.length+1), code:"C3", description:"", regulation:"", location:"", recommendation:"", photo:null});
const openNew = () => { setForm(blankObs()); setEditing("new"); setShowLibrary(false); };
const openEdit = (i) => { setForm({...observations[i]}); setEditing(i); setShowLibrary(false); };
const setF = (k,v) => setForm(f=>({...f,[k]:v}));

const saveObs = () => {
  if(editing==="new") setObservations(o=>[...o,form]);
  else setObservations(o=>o.map((x,i)=>i===editing?form:x));
  setEditing(null); setForm(null);
};

const pickFromLibrary = (item) => {
  setF("description", item.text);
  setF("code", item.code);
  setShowLibrary(false);
};

const handlePhoto = (e) => {
  const file = e.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev => setF("photo", ev.target.result);
  reader.readAsDataURL(file);
};

const codeCol = {C1:"#dc2626",C2:"#ea580c",C3:"#d97706",FI:"#7c3aed"};

// Library modal
if(showLibrary) {
  const allSections = ["all", ...EICR_OBS_LIBRARY.map(s=>s.section)];
  const filtered = EICR_OBS_LIBRARY
    .filter(s => librarySection==="all" || s.section===librarySection)
    .flatMap(s => s.items.map(i=>({...i, section:s.section})))
    .filter(i => !librarySearch || i.text.toLowerCase().includes(librarySearch.toLowerCase()));

  return (
    <div style={{padding:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:16,fontWeight:700,color:"#1e3a5f"}}>Observation Library</div>
        <button onClick={()=>setShowLibrary(false)} style={{background:"none",border:"none",fontSize:20,color:"#64748b",cursor:"pointer"}}>×</button>
      </div>
      <input style={{...S.input,marginBottom:8}} placeholder="Search observations..." value={librarySearch} onChange={e=>setLibrarySearch(e.target.value)}/>
      <select style={{...S.input,marginBottom:12,background:"#f8fafc"}} value={librarySection} onChange={e=>setLibrarySection(e.target.value)}>
        {allSections.map(s=><option key={s} value={s}>{s==="all"?"All Sections":s}</option>)}
      </select>
      <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>{filtered.length} observations</div>
      {filtered.map((item,i)=>(
        <button key={i} onClick={()=>pickFromLibrary(item)} style={{display:"block",width:"100%",textAlign:"left",background:"#f8fafc",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"10px 12px",marginBottom:6,cursor:"pointer",fontFamily:"inherit"}}>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:2}}>{item.section}</div>
          <div style={{fontSize:13,color:"#1e3a5f"}}>{item.text}</div>
        </button>
      ))}
    </div>
  );
}

if(form) return (
<div style={{padding:16}}>
  <div style={{fontSize:16,fontWeight:700,color:"#1e3a5f",marginBottom:12}}>Section 7 — Observation {form.item_no}</div>

  <div style={{marginBottom:12}}>
    <label style={S.label}>Classification Code</label>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
      {["C1","C2","C3","FI"].map(c=>(
        <button key={c} onClick={()=>setF("code",c)} style={{padding:"12px",borderRadius:8,border:"2px solid",borderColor:form.code===c?codeCol[c]:"#e2e8f0",background:form.code===c?codeCol[c]+"22":"#f8fafc",color:form.code===c?codeCol[c]:"#64748b",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>
      ))}
    </div>
    <div style={{fontSize:11,color:"#64748b",marginTop:6,padding:"6px 10px",background:"#f8fafc",borderRadius:6}}>
      {form.code==="C1"&&"Danger Present — Risk of injury. Immediate remedial action required."}
      {form.code==="C2"&&"Potentially Dangerous — Urgent remedial action required."}
      {form.code==="C3"&&"Improvement Recommended."}
      {form.code==="FI"&&"Further Investigation Required Without Delay."}
    </div>
  </div>

  <div style={{marginBottom:10}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
      <label style={S.label}>Observation</label>
      <button onClick={()=>setShowLibrary(true)} style={{fontSize:11,color:"#1e3a5f",background:"#f0f4ff",border:"1px solid #c7d2fe",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>📋 From Library</button>
    </div>
    <textarea style={{...S.input,minHeight:80}} value={form.description} onChange={e=>setF("description",e.target.value)} placeholder="Describe the observation or defect..."/>
  </div>

  <div style={{marginBottom:10}}><label style={S.label}>Regulation Reference</label>
    <input style={S.input} value={form.regulation} onChange={e=>setF("regulation",e.target.value)} placeholder="e.g. BS 7671 Reg 411.3.3"/>
  </div>
  <div style={{marginBottom:10}}><label style={S.label}>Location</label>
    <input style={S.input} value={form.location} onChange={e=>setF("location",e.target.value)} placeholder="e.g. Consumer unit, Bedroom 1"/>
  </div>
  <div style={{marginBottom:10}}><label style={S.label}>Recommended Action</label>
    <textarea style={{...S.input,minHeight:60}} value={form.recommendation} onChange={e=>setF("recommendation",e.target.value)} placeholder="What remedial action is required..."/>
  </div>

  <div style={{marginBottom:16}}>
    <label style={S.label}>Photo</label>
    {form.photo ? (
      <div style={{position:"relative",marginBottom:8}}>
        <img src={form.photo} style={{width:"100%",borderRadius:8,border:"1.5px solid #e2e8f0"}} alt="observation"/>
        <button onClick={()=>setF("photo",null)} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,0.5)",border:"none",color:"#fff",borderRadius:20,width:28,height:28,cursor:"pointer",fontSize:14}}>×</button>
      </div>
    ) : (
      <label style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"14px",background:"#f8fafc",border:"2px dashed #e2e8f0",borderRadius:8,cursor:"pointer",color:"#64748b",fontSize:13}}>
        📷 Add Photo
        <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:"none"}}/>
      </label>
    )}
  </div>

  <button style={S.btn("primary")} onClick={saveObs}>Save Observation</button>
  <button style={S.btn("ghost")} onClick={()=>{setEditing(null);setForm(null);}}>Cancel</button>
</div>
);

const c1s=observations.filter(o=>o.code==="C1");
const c2s=observations.filter(o=>o.code==="C2");
const c3s=observations.filter(o=>o.code==="C3");
const fis=observations.filter(o=>o.code==="FI");

return (
<div style={{padding:16}}>
  <div style={{background:"#1e3a5f",color:"#fff",borderRadius:"8px 8px 0 0",padding:"8px 12px",fontSize:12,fontWeight:700}}>7 OBSERVATIONS AND RECOMMENDATIONS FOR ACTIONS TO BE TAKEN</div>
  <div style={{border:"1.5px solid #1e3a5f",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"12px",marginBottom:12}}>
    {observations.length===0 ? (
      <div style={{fontSize:13,color:"#64748b",marginBottom:8}}>☑ There are no items adversely affecting electrical safety</div>
    ) : (
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
        {[["C1",c1s,"#dc2626"],["C2",c2s,"#ea580c"],["C3",c3s,"#d97706"],["FI",fis,"#7c3aed"]].map(([code,items,col])=>(
          <div key={code} style={{background:items.length>0?col+"22":"#f8fafc",border:`1.5px solid ${items.length>0?col:"#e2e8f0"}`,borderRadius:8,padding:"8px 10px"}}>
            <div style={{fontSize:10,fontWeight:700,color:items.length>0?col:"#94a3b8"}}>{code}</div>
            <div style={{fontSize:18,fontWeight:700,color:items.length>0?col:"#94a3b8"}}>{items.length}</div>
            <div style={{fontSize:9,color:"#64748b"}}>{items.map(o=>o.item_no).join(", ")||"None"}</div>
          </div>
        ))}
      </div>
    )}

    {observations.map((obs,i)=>(
      <div key={i} onClick={()=>openEdit(i)} style={{background:"#fff",border:"2px solid",borderColor:codeCol[obs.code]||"#e2e8f0",borderRadius:10,padding:"10px 12px",marginBottom:6,cursor:"pointer"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:11,color:"#64748b"}}>Item {obs.item_no}</span>
            <span style={{fontSize:11,fontWeight:700,color:"#fff",background:codeCol[obs.code],padding:"2px 8px",borderRadius:4}}>{obs.code}</span>
          </div>
          <button onClick={e=>{e.stopPropagation();setObservations(o=>o.filter((_,idx)=>idx!==i));}} style={{background:"none",border:"none",color:"#94a3b8",fontSize:18,cursor:"pointer",padding:"0 4px"}}>×</button>
        </div>
        <div style={{fontSize:13,color:"#1e3a5f",fontWeight:600,marginBottom:2}}>{obs.description||"No description"}</div>
        {obs.regulation && <div style={{fontSize:11,color:"#64748b"}}>Reg: {obs.regulation}</div>}
        {obs.location && <div style={{fontSize:11,color:"#64748b"}}>Location: {obs.location}</div>}
        {obs.photo && <img src={obs.photo} style={{width:60,height:60,objectFit:"cover",borderRadius:6,marginTop:6,border:"1px solid #e2e8f0"}} alt=""/>}
      </div>
    ))}
    <button style={{...S.btn("primary"),marginBottom:0}} onClick={openNew}>+ Add Observation</button>
  </div>

  <button style={S.btn("primary")} onClick={()=>onNext(observations)}>Continue to Review -></button>
  <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
</div>
);
}

// ============================================================
// EICR SUMMARY SCREEN
// ============================================================
function EICRSummaryScreen({ job, eicrInstall, eicrSupply, eicrCircuits, eicrInspection, eicrObservations, profile, onBack, onGeneratePDF }) {
  const obs = eicrObservations || [];
  const c1s = obs.filter(o => o.code === "C1");
  const c2s = obs.filter(o => o.code === "C2");
  const c3s = obs.filter(o => o.code === "C3");
  const fis = obs.filter(o => o.code === "FI");
  const front = eicrInstall || {};
  const overall = front.overall_assessment || "SATISFACTORY";
  const overallCol = overall === "SATISFACTORY" ? "#059669" : "#dc2626";

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", marginBottom: 4 }}>EICR COMPLETE</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "#1e3a5f", marginBottom: 16 }}>Job Summary</div>

      {/* Overall status */}
      <div style={{ background: "#fff", border: `2px solid ${overallCol}`, borderRadius: 12, padding: 16, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b" }}>{job?.client}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{job?.jobNumber} · EICR</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>{job?.address}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>OVERALL</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: overallCol }}>{overall}</div>
        </div>
      </div>

      {/* Counts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[[c1s.length, "C1", "#dc2626"], [c2s.length, "C2", "#ea580c"], [c3s.length, "C3", "#d97706"], [fis.length, "FI", "#7c3aed"]].map(([n, l, col]) => (
          <div key={l} style={{ background: "#fff", border: `1.5px solid ${n > 0 ? col + "44" : "#e2e8f0"}`, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: n > 0 ? col : "#94a3b8" }}>{n}</div>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.1em", fontWeight: 700 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Data checklist */}
      <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 14, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: "#1e3a5f", fontWeight: 700, marginBottom: 10, letterSpacing: "0.06em" }}>DATA CAPTURED</div>
        {[
          ["Front Sheet", !!eicrInstall],
          ["Supply Details", !!eicrSupply],
          ["Circuit Schedule", (eicrCircuits?.length || 0) > 0],
          ["Inspection Schedule", !!eicrInspection && Object.keys(eicrInspection).length > 0],
          ["Observations", obs.length > 0 || true],
          ["Engineer Profile", !!profile?.full_name],
        ].map(([label, done]) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ fontSize: 13, color: "#334155" }}>{label}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: done ? "#059669" : "#94a3b8" }}>{done ? "✓" : "—"}</span>
          </div>
        ))}
      </div>

      {/* Limitations summary */}
      {(front.agreed_limitation_ids?.length > 0 || front.operational_limitation_ids?.length > 0) && (
        <div style={{ background: "#f0f9ff", border: "1.5px solid #bae6fd", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: "#0369a1", fontWeight: 700, marginBottom: 6 }}>LIMITATIONS ON THIS REPORT</div>
          {front.agreed_limitation_ids?.length > 0 && (
            <div style={{ fontSize: 12, color: "#334155", marginBottom: 4 }}>
              Agreed: {front.agreed_limitation_ids.map(i => String.fromCharCode(97 + i)).join(", ")} — see continuation sheet
            </div>
          )}
          {front.operational_limitation_ids?.length > 0 && (
            <div style={{ fontSize: 12, color: "#334155" }}>
              Operational: {front.operational_limitation_ids.map(i => i + 1).join(", ")} — see continuation sheet
            </div>
          )}
        </div>
      )}

      <button style={S.btn("primary")} onClick={onGeneratePDF}>📄 Generate EICR Certificate</button>
      <button style={S.btn("ghost")} onClick={onBack}>← Back to Observations</button>
    </div>
  );
}

// ============================================================
// EICR PDF GENERATOR
// ============================================================
// ============================================================
// EICR HTML CERTIFICATE GENERATOR
// Opens in new tab - engineer prints/saves as PDF
// ============================================================
function generateEICRHTML(job, eicrInstall, eicrSupply, eicrCircuits, eicrInspection, eicrObservations, profile) {
  try {
  const front = eicrInstall || {};
  const supply = eicrSupply || {};
  const circuits = eicrCircuits || [];
  const obs = eicrObservations || [];
  const inspection = eicrInspection || {};
  const overall = front.overall_assessment || "SATISFACTORY";

  const RIVERSIDE_AGREED = [
    "100% of electrical accessories to be visually checked externally. As a minimum, 20% of electrical accessories to be opened for inspection. The sample size may be increased dependent upon findings.",
    "The main heating system for the property shall be tested with circuit protective conductor continuity confirmed at all relevant points. Insulation resistance tests will also be carried out. It is acceptable to measure insulation resistance between the live conductors connected together and the earthing arrangement, or to perform the insulation resistance test at 250V DC, where connected equipment may cause a misleading reading to be obtained, or where components are likely to be damaged if the test is performed at 500V DC.",
    "The fixed wiring (AC) of photovoltaic systems (PV) is to form part of the inspection and testing process. The fixed wiring is to be tested to the furthest point of isolation (AC) with a visual inspection undertaken beyond the point of isolation to verify the system is safe for continued use.",
    "In communal areas, specialist installations inclusive of lifts and fire alarms shall not be considered as part of the electrical fixed wiring of the property and shall be tested up to the point of local isolation only. A visual inspection beyond the point of isolation will be required, so to ensure that no immediate dangers exist, and that where required, cables are adequately supported from premature collapse in the event of fire.",
    "Where storage heaters provide the source of heating, the circuit shall be tested to the point of isolation only, with the circuit protective conductor continuity confirmed at the appliance by the R2 testing method. A visual inspection of the appliance shall also be undertaken to confirm adequacy."
  ];
  const RIVERSIDE_OP = [
    "Required distribution network operator supply fuse information shall be obtained in every case where practically possible. If the distribution network operator cannot provide the required information, the fuse characteristics shall be recorded as 'LIM' on the report.",
    "For circuits supplying very large or integrated appliances, the final point of testing shall be considered as the control switch or spur and not the socket outlet behind the appliance. This shall be to minimise damage to floor areas by moving of appliances and prevent damage to appliances during testing. In this instance an R2 test shall be undertaken to verify that an appliance is adequately earthed, and a visual check of the relevant outlet made if possible (tenanted properties only).",
    "As described in IET Guidance Note 3, if required, live to live insulation resistance testing may be omitted as part of the testing carried out, in order to minimise risk of damage to sensitive equipment (tenanted properties only).",
    "Some accessories may be inaccessible, and each individual case should be recorded as an operational limitation along with the reason as to why this is the case (tenanted properties only).",
    "'Off-peak' systems which have not had live testing undertaken due to the installation not being energised at the time of the inspection, are to be subject to a thorough visual inspection, with all circuits subject to the relevant 'dead' tests as detailed in BS 7671 and Guidance Note 3."
  ];

  const agreedIds = front.agreed_limitation_ids || [];
  const opIds = front.operational_limitation_ids || [];
  const selectedAgreed = agreedIds.map(i => ({ letter: String.fromCharCode(65+i), text: RIVERSIDE_AGREED[i] })).filter(x=>x.text);
  const selectedOp = opIds.map(i => ({ num: i+1, text: RIVERSIDE_OP[i] })).filter(x=>x.text);

  const c1s = obs.filter(o=>o.code==="C1");
  const c2s = obs.filter(o=>o.code==="C2");
  const c3s = obs.filter(o=>o.code==="C3");
  const fis = obs.filter(o=>o.code==="FI");

  const ITEMS = {"1.1.1":"Service cable","1.1.2":"Service head","1.1.3":"Earthing arrangement","1.1.4":"Meter tails","1.1.5":"Metering equipment","1.1.6":"Isolator (where present)","1.2":"Consumer's isolator (where present)","1.3":"Consumer's meter tails","2.1":"Adequate arrangements for microgenerators/other sources (551.6; 551.7)","3.1":"Presence and condition of distributor's earthing arrangement (542.1.2.1; 542.1.2.2)","3.2":"Presence and condition of earth electrode connection where applicable (542.1.2.3)","3.3":"Provision of earthing/bonding labels at all appropriate locations (514.13.1)","3.4":"Confirmation of earthing conductor size (542.3; 543.1.1)","3.5":"Accessibility and condition of earthing conductor at MET (543.3.2)","3.6":"Confirmation of main protective bonding conductor sizes (544.1)","3.7":"Condition and accessibility of main protective bonding conductor connections (543.3.2; 544.1.2)","3.8":"Accessibility and condition of other protective bonding connections (543.3.1; 543.3.2)","4.1":"Adequacy of working space/accessibility to consumer unit/distribution board (132.12; 513.1)","4.2":"Security of fixing (134.1.1)","4.3":"Condition of enclosure(s) in terms of IP rating etc (416.2)","4.4":"Condition of enclosure(s) in terms of fire rating etc (421.1.201; 526.5)","4.5":"Enclosure not damaged/deteriorated so as to impair safety (651.2)","4.6":"Presence of main linked switch (as required by 462.1.201)","4.7":"Operation of main switch (functional check) (643.10)","4.8":"Manual operation of circuit-breakers and RCDs to prove disconnection (643.10)","4.9":"Correct identification of circuit details and protective devices (514.8.1; 514.9.1)","4.10":"Presence of RCD six-monthly test notice, where required (514.12.2)","4.11":"Presence of alternative supply warning notice at or near consumer unit/distribution board (514.15)","4.12":"Presence of other required labelling (please specify) (Section 514)","4.13":"Compatibility of protective devices, bases and other components; correct type and rating — no signs of unacceptable thermal damage, arcing or overheating (411.3.2; 411.4; 411.5; 411.6; Sections 432, 433)","4.14":"Single-pole switching or protective devices in line conductor only (132.14.1; 530.3.3)","4.15":"Protection against mechanical damage where cables enter consumer unit/distribution board (522.8.1; 522.8.5; 522.8.11)","4.16":"Protection against electromagnetic effects where cables enter consumer unit/distribution board/enclosures (521.5.1)","4.17":"RCD(s) provided for fault protection — includes RCBOs (411.4.204; 411.5.2; 531.2)","4.18":"RCD(s) provided for additional protection/requirements — includes RCBOs (411.3.3; 415.1)","4.19":"Confirmation of indication that SPD is functional (651.4)","4.20":"Confirmation that ALL conductor connections, including connections to busbars, are correctly located in terminals and are tight and secure (526.1)","4.21":"Adequate arrangements where a generating set operates as a switched alternative to the public supply (551.6)","4.22":"Adequate arrangements where a generating set operates in parallel with the public supply (551.7)","5.1":"Identification of conductors (514.3.1)","5.2":"Cables correctly supported throughout their run (521.10.202; 522.8.5)","5.3":"Condition of insulation of live parts (416.1)","5.4":"Non-sheathed cables protected by enclosure in conduit, ducting or trunking (521.10.1)","5.4.1":"Integrity of conduit and trunking systems (metallic and plastic)","5.5":"Adequacy of cables for current-carrying capacity with regard for the type and nature of installation (Section 523)","5.6":"Coordination between conductors and overload protective devices (433.1; 533.2.1)","5.7":"Adequacy of protective devices: type and rated current for fault protection (411.3)","5.8":"Presence and adequacy of circuit protective conductors (411.3.1; Section 543)","5.9":"Wiring system(s) appropriate for the type and nature of the installation and external influences (Section 522)","5.10":"Concealed cables installed in prescribed zones — see Section 4 Extent and Limitations (522.6.202)","5.11":"Cables concealed under floors, above ceilings or in walls/partitions, adequately protected against damage — see Section 4 (522.6.204)","5.12.1":"Additional protection RCD ≤30mA — all socket-outlets of rating 32A or less (411.3.3)","5.12.2":"Additional protection RCD ≤30mA — supply of mobile equipment not exceeding 32A for use outdoors (411.3.3)","5.12.3":"Additional protection RCD ≤30mA — cables concealed in walls at depth less than 50mm (522.6.202; 522.6.203)","5.12.4":"Additional protection RCD ≤30mA — cables in walls/partitions containing metal parts regardless of depth (522.6.203)","5.12.5":"Additional protection RCD ≤30mA — final circuits supplying luminaires within domestic premises (411.3.4)","5.13":"Provision of fire barriers, sealing arrangements and protection against thermal effects (Section 527)","5.14":"Band II cables segregated/separated from Band I cables (528.1)","5.15":"Cables segregated/separated from communications cabling (528.2)","5.16":"Cables segregated/separated from non-electrical services (528.3)","5.17.1":"Termination of cables — connections soundly made and under no undue strain (526.6)","5.17.2":"Termination of cables — no basic insulation of a conductor visible outside enclosure (526.8)","5.17.3":"Termination of cables — connections of live conductors adequately enclosed (526.5)","5.17.4":"Termination of cables — adequately connected at point of entry to enclosure, glands, bushes etc. (522.8.5)","5.18":"Condition of accessories including socket-outlets, switches and joint boxes (651.2(v))","5.19":"Suitability of accessories for external influences (512.2)","5.20":"Adequacy of working space/accessibility to equipment (132.12; 513.1)","5.21":"Single-pole switching or protective devices in line conductors only (132.14.1; 530.3.3)","6.1":"Additional protection for all LV circuits by RCD not exceeding 30mA (701.411.3.3)","6.2":"Where used as protective measure, requirements for SELV or PELV met (701.414.4.5)","6.3":"Shaver supply units comply with BS EN 61558-2-5 formerly BS 3535 (701.512.3)","6.4":"Presence of supplementary bonding conductors, unless not required by BS 7671:2018 (701.415.2)","6.5":"Low voltage (e.g. 230V) socket-outlets sited at least 2.5m from zone 1 (701.512.3)","6.6":"Suitability of equipment for external influences for installed location in terms of IP rating (701.512.2)","6.7":"Suitability of accessories and controlgear etc. for a particular zone (701.512.3)","6.8":"Suitability of current-using equipment for particular position within the location (701.55)","7.1":"Special installation or location 1 (specify if applicable)","7.2":"Special installation or location 2 (specify if applicable)","8.1":"Additional requirements relating to Chapter 82 — item 1","8.2":"Additional requirements relating to Chapter 82 — item 2"};

  const oLabel = a => ({pass:"✓",c1:"C1",c2:"C2",c3:"C3",fi:"FI",lim:"LIM",nv:"N/V",na:"N/A"}[a]||a||"");
  const oColor = a => ({pass:"#059669",c1:"#c41c1c",c2:"#c2410c",c3:"#b45309",fi:"#6d28d9",lim:"#0369a1",na:"#94a3b8",nv:"#94a3b8"}[a]||"#1e293b");

  const cell = (label, value, span=1) => `<td colspan="${span}" style="padding:4px 6px;border:1px solid #cbd5e1;vertical-align:top"><span style="display:block;font-size:6.5px;color:#64748b;text-transform:uppercase;letter-spacing:.03em;margin-bottom:1px">${label}</span><span style="font-size:9px;font-weight:600;color:#1e293b">${value||"—"}</span></td>`;

  const secTitle = (text, color="#1e3a5f") => `<div style="background:${color};color:#fff;padding:5px 8px;font-size:9.5px;font-weight:700;margin-top:8px;letter-spacing:.02em">${text}</div>`;

  const inspSections = [
    {label:"1.0 Intake Equipment (Visual Inspection Only)",ids:["1.1.1","1.1.2","1.1.3","1.1.4","1.1.5","1.1.6","1.2","1.3"]},
    {label:"2.0 Adequate Arrangements for Other Sources (Microgenerators)",ids:["2.1"]},
    {label:"3.0 Earthing / Bonding Arrangements (411.3; Chap 54)",ids:["3.1","3.2","3.3","3.4","3.5","3.6","3.7","3.8"]},
    {label:"4.0 Consumer Unit(s) / Distribution Board(s)",ids:["4.1","4.2","4.3","4.4","4.5","4.6","4.7","4.8","4.9","4.10","4.11","4.12","4.13","4.14","4.15","4.16","4.17","4.18","4.19","4.20","4.21","4.22"]},
    {label:"5.0 Final Circuits",ids:["5.1","5.2","5.3","5.4","5.4.1","5.5","5.6","5.7","5.8","5.9","5.10","5.11","5.12.1","5.12.2","5.12.3","5.12.4","5.12.5","5.13","5.14","5.15","5.16","5.17.1","5.17.2","5.17.3","5.17.4","5.18","5.19","5.20","5.21"]},
    {label:"6.0 Location(s) Containing a Bath or Shower",ids:["6.1","6.2","6.3","6.4","6.5","6.6","6.7","6.8"]},
    {label:"7.0 Other Part 7 Special Installations or Locations",ids:["7.1","7.2"]},
    {label:"8.0 Prosumer's Low Voltage Electrical Installation(s)",ids:["8.1","8.2"]},
  ];

  const inspRows = inspSections.map(s=>`
    <tr style="background:#1e3a5f"><td colspan="3" style="padding:4px 8px;color:#fff;font-size:8.5px;font-weight:700;border:1px solid #1e3a5f">${s.label}</td></tr>
    ${s.ids.map(id=>{
      const v=inspection[id]; const ans=v?.answer||""; const note=v?.note||"";
      const col=oColor(ans); const lbl=oLabel(ans);
      return `<tr>
        <td style="width:52px;padding:3px 6px;font-size:8px;color:#475569;border:1px solid #e2e8f0;white-space:nowrap">${id}</td>
        <td style="padding:3px 8px;font-size:8px;color:#1e293b;border:1px solid #e2e8f0">${ITEMS[id]||id}${note?` <em style="color:#94a3b8;font-size:7.5px">— ${note}</em>`:""}</td>
        <td style="width:44px;padding:3px 4px;text-align:center;font-size:8.5px;font-weight:700;color:${col};border:1px solid #e2e8f0">${lbl}</td>
      </tr>`;
    }).join("")}`
  ).join("");

  const circRows = circuits.length>0 ? circuits.map(c=>`
    <tr style="font-size:7px">
      <td>${c.circuit_ref||""}</td><td>${c.designation||""}</td>
      <td>${c.wiring_type||""}</td><td>${c.ref_method||""}</td><td>${c.points||""}</td>
      <td>${c.cb_rating||""}</td><td>${c.cb_type||""}</td><td>${c.cb_bs||""}</td>
      <td>${c.rcd_type||""}</td><td>${c.rcd_rating||""}</td>
      <td>${c.max_zs||""}</td><td>${c.r1_r2||""}</td><td>${c.r2||""}</td><td>${c.rn||""}</td>
      <td>${c.ir_ll||""}</td><td>${c.ir_le||""}</td>
      <td style="text-align:center">${c.polarity?"✓":""}</td>
      <td>${c.zs_measured||""}</td><td>${c.rcd_op_time||""}</td><td>${c.afd_test||""}</td>
    </tr>`).join("")
    : `<tr><td colspan="20" style="text-align:center;color:#94a3b8;padding:8px;font-size:8px">No circuits recorded</td></tr>`;

  const obsRows = obs.length>0 ? obs.map((o,i)=>{
    const codeColors={C1:"#c41c1c",C2:"#c2410c",C3:"#b45309",FI:"#6d28d9"};
    const col=codeColors[o.code]||"#1e293b";
    const photoHTML = o.photo ? `<div style="margin-top:5px"><img src="${o.photo}" style="max-width:160px;max-height:110px;border-radius:3px;border:1px solid #e2e8f0"></div>` : "";
    return `<tr>
      <td style="width:32px;padding:5px 6px;font-size:8.5px;color:#64748b;border:1px solid #e2e8f0;text-align:center;vertical-align:top">${i+1}</td>
      <td style="padding:5px 8px;font-size:8.5px;color:#1e293b;border:1px solid #e2e8f0;vertical-align:top">${o.description||""}${photoHTML}</td>
      <td style="width:36px;padding:5px 4px;font-size:9px;font-weight:700;color:${col};text-align:center;border:1px solid #e2e8f0;vertical-align:top">${o.code||""}</td>
      <td style="width:80px;padding:5px 6px;font-size:8px;color:#475569;border:1px solid #e2e8f0;vertical-align:top">${o.location||""}</td>
      <td style="width:70px;padding:5px 6px;font-size:8px;color:#475569;border:1px solid #e2e8f0;vertical-align:top">${o.regulation||""}</td>
    </tr>`;
  }).join("") : `<tr><td colspan="5" style="padding:10px;text-align:center;color:#94a3b8;font-size:8.5px;border:1px solid #e2e8f0">No formal observations recorded</td></tr>`;

  const tick = v => v ? "✓" : "N/A";
  const sigImg = profile?.signature_data ? `<img src="${profile.signature_data}" style="height:28px;margin-top:2px">` : `<div style="width:120px;height:28px;border:1px solid #cbd5e1;display:inline-block"></div>`;

  const agreedLimSummary = agreedIds.length>0
    ? agreedIds.map(i=>String.fromCharCode(65+i)).join(", ") + " — see continuation sheet"
    : (front.agreed_limitations || "None");
  const opLimSummary = opIds.length>0
    ? opIds.map(i=>i+1).join(", ") + " — see continuation sheet"
    : (front.operational_limitations || "None");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EICR — ${job?.jobNumber||""} — ${job?.address||""}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#1e293b;background:#f1f5f9}
.page{width:297mm;background:#fff;margin:0 auto 12px;padding:8mm 12mm;position:relative}
table{width:100%;border-collapse:collapse}
th{background:#1e3a5f;color:#fff;padding:4px 6px;font-size:8px;border:1px solid #1e3a5f;text-align:left}
td{padding:3px 6px;font-size:8.5px;border:1px solid #e2e8f0;vertical-align:top}
.pg-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:6px;margin-bottom:6px;border-bottom:2px solid #1e3a5f}
.pg-title{font-size:13px;font-weight:700;color:#1e3a5f;line-height:1.2}
.pg-sub{font-size:7px;color:#64748b;margin-top:2px}
.cert-box{border:1.5px solid #1e3a5f;padding:4px 8px;font-size:8px;font-weight:700;color:#1e3a5f;text-align:center;min-width:80px}
.sec{background:#1e3a5f;color:#fff;padding:4px 8px;font-size:9px;font-weight:700;margin:7px 0 0}
.sec-red{background:#7f1d1d}
.sec-teal{background:#134e4a}
.field-row{display:flex;border:1px solid #cbd5e1}
.field-row+.field-row{border-top:none}
.field{flex:1;padding:3px 6px;border-right:1px solid #cbd5e1}
.field:last-child{border-right:none}
.flabel{font-size:6.5px;color:#64748b;text-transform:uppercase;letter-spacing:.04em;display:block;margin-bottom:1px}
.fval{font-size:9px;font-weight:600;color:#1e293b}
.grid-box{border:1px solid #cbd5e1;padding:6px 8px}
.grid-3col{display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid #cbd5e1}
.grid-2col{display:grid;grid-template-columns:1fr 1fr;border:1px solid #cbd5e1}
.gcol{padding:5px 8px;border-right:1px solid #cbd5e1}
.gcol:last-child{border-right:none}
.gcol-title{font-size:7.5px;font-weight:700;color:#1e3a5f;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px;padding-bottom:3px;border-bottom:1px solid #e2e8f0}
.kv{display:flex;justify-content:space-between;align-items:baseline;padding:1.5px 0;font-size:8px}
.kv-k{color:#64748b}
.kv-v{font-weight:600;color:#1e293b}
.badge{display:inline-block;padding:3px 14px;font-size:11px;font-weight:700;border-radius:3px}
.badge-sat{background:#f0fdf4;color:#166534;border:1.5px solid #16a34a}
.badge-unsat{background:#fef2f2;color:#991b1b;border:1.5px solid #dc2626}
.counts{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:5px;margin:5px 0}
.cbox{border:1px solid #e2e8f0;padding:5px;text-align:center;border-radius:3px}
.cnum{font-size:20px;font-weight:700;line-height:1}
.clbl{font-size:7px;color:#64748b;margin-top:2px}
.print-btn{position:fixed;top:10px;right:10px;z-index:9999;display:flex;gap:6px}
.btn-print{background:#1e3a5f;color:#fff;border:none;padding:9px 18px;border-radius:5px;font-size:12px;font-weight:700;cursor:pointer}
.btn-close{background:#e2e8f0;color:#334155;border:none;padding:9px 14px;border-radius:5px;font-size:12px;cursor:pointer}
@media print{
  body{background:#fff}
  .page{margin:0;box-shadow:none;page-break-after:always}
  .page:last-child{page-break-after:auto}
  .print-btn{display:none}
  @page{size:A4 landscape;margin:7mm 10mm}
}
</style>
</head>
<body>

<div class="print-btn">
  <button class="btn-print" onclick="window.print()">🖨 Print / Save PDF</button>
  <button class="btn-close" onclick="window.close()">✕</button>
</div>

<!-- ═══════════════════════════════════════════════════════════
     PAGE 1 — FRONT SHEET
════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="pg-header">
    <div>
      <div class="pg-title">ELECTRICAL INSTALLATION CONDITION REPORT</div>
      <div class="pg-sub">Issued in accordance with BS 7671:2018+A2:2022 — Requirements for Electrical Installations &nbsp;·&nbsp; For small installations not exceeding 100A</div>
    </div>
    <div>
      <div class="cert-box">Cert No.<br>${job?.jobNumber||"—"}</div>
    </div>
  </div>

  <div class="sec">PART 1: DETAILS OF CONTRACTOR, CLIENT AND INSTALLATION</div>
  <div class="grid-3col">
    <div class="gcol">
      <div class="gcol-title">Details of the Contractor</div>
      <div class="kv"><span class="kv-k">Trading Title</span><span class="kv-v">Elect Building &amp; Maintenance Ltd</span></div>
      <div class="kv"><span class="kv-k">Address</span><span class="kv-v">603 Princess Drive, Page Moss, Liverpool, L14 9ND</span></div>
      <div class="kv"><span class="kv-k">Registration No.</span><span class="kv-v">610265000</span></div>
      <div class="kv"><span class="kv-k">Telephone</span><span class="kv-v">0151 792 6856</span></div>
    </div>
    <div class="gcol">
      <div class="gcol-title">Details of the Client</div>
      <div class="kv"><span class="kv-k">Name</span><span class="kv-v">${front.agreed_with||job?.client||"—"}</span></div>
      <div class="kv"><span class="kv-k">Address</span><span class="kv-v" style="white-space:pre-line">${front.template_id==="riverside"?"2 Estuary Boulevard, Liverpool, L24 8RF":"—"}</span></div>
      <div class="kv"><span class="kv-k">Telephone</span><span class="kv-v">—</span></div>
    </div>
    <div class="gcol" style="border-right:none">
      <div class="gcol-title">Details of the Installation</div>
      <div class="kv"><span class="kv-k">Occupier</span><span class="kv-v">${front.occupier_title||job?.client||"—"}</span></div>
      <div class="kv"><span class="kv-k">Address</span><span class="kv-v">${job?.address||"—"}</span></div>
      <div class="kv"><span class="kv-k">UPRN</span><span class="kv-v">${job?.uprn||"—"}</span></div>
    </div>
  </div>

  <div class="sec">PART 2: PURPOSE OF THE REPORT</div>
  <div class="grid-box">
    <div style="font-size:8.5px;line-height:1.6;margin-bottom:6px">${front.purpose||"To check the electrical fixed wiring within the property for safety of continued use."}</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid #e2e8f0;padding-top:5px">
      <div><span class="flabel">Date of inspection</span><span class="fval">${job?.date||"—"}</span></div>
      <div><span class="flabel">Records available (651.1)</span><span class="fval">${front.records_available||"N/A"}</span></div>
      <div><span class="flabel">Date of last inspection</span><span class="fval">${front.last_inspection||"N/A"}</span></div>
      <div><span class="flabel">Estimated age of wiring</span><span class="fval">${front.wiring_age||"—"} years</span></div>
    </div>
  </div>

  <div class="sec">PART 3: SUMMARY OF THE CONDITION OF THE INSTALLATION</div>
  <div class="grid-box">
    <div style="font-size:7.5px;color:#64748b;margin-bottom:4px">General condition of the installation (in terms of electrical safety)</div>
    <div style="font-size:8.5px;line-height:1.6;margin-bottom:8px">${front.reason||"Periodic inspection and testing carried out."}</div>
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:8px">
      <div>
        <div style="font-size:7px;color:#64748b;margin-bottom:3px">OVERALL ASSESSMENT</div>
        <div class="badge ${overall==="SATISFACTORY"?"badge-sat":"badge-unsat"}">${overall}</div>
      </div>
      <div><span class="flabel">Next inspection recommended by</span><span class="fval">${front.next_inspection||"—"}</span></div>
      <div><span class="flabel">Evidence of additions/alterations</span><span class="fval">${front.evidence_additions?"Yes — approx. "+(front.additions_age||"?")+" years":"No"}</span></div>
      <div><span class="flabel">Description of premises</span><span class="fval">Dwelling</span></div>
    </div>
    <div class="counts">
      <div class="cbox" style="border-color:#fecaca"><div class="cnum" style="color:#c41c1c">${c1s.length}</div><div class="clbl">C1 — Danger Present</div></div>
      <div class="cbox" style="border-color:#fed7aa"><div class="cnum" style="color:#c2410c">${c2s.length}</div><div class="clbl">C2 — Potentially Dangerous</div></div>
      <div class="cbox" style="border-color:#fde68a"><div class="cnum" style="color:#b45309">${c3s.length}</div><div class="clbl">C3 — Improvement Recommended</div></div>
      <div class="cbox" style="border-color:#ddd6fe"><div class="cnum" style="color:#6d28d9">${fis.length}</div><div class="clbl">FI — Further Investigation</div></div>
    </div>
    <div style="font-size:7.5px;color:#64748b;margin-top:5px">**An unsatisfactory assessment indicates that dangerous (Code C1) and/or potentially dangerous (Code C2) conditions have been identified and it is recommended that these are acted upon as a matter of urgency.</div>
  </div>

  <div class="sec">PART 4: DECLARATION</div>
  <div class="grid-box">
    <div style="font-size:8px;line-height:1.6;margin-bottom:7px;color:#334155">I/We, being the person(s) responsible for the inspection and testing of the electrical installation (as indicated by my/our signatures below), particulars of which are described above, having exercised reasonable skill and care when carrying out the inspection and testing, hereby declare that the information in this report, including the observations and the attached schedules, provides an accurate assessment of the condition of the electrical installation taking into account the stated extent and limitations.</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-bottom:6px">
      <div><span class="flabel">Engineer name</span><span class="fval">${profile?.full_name||job?.engineer||"—"}</span></div>
      <div><span class="flabel">Qualification</span><span class="fval">${profile?.qualification||"—"}</span></div>
      <div><span class="flabel">Reg. Number</span><span class="fval">${profile?.reg_number||"—"}</span></div>
      <div><span class="flabel">Date</span><span class="fval">${job?.date||"—"}</span></div>
    </div>
    <div style="display:flex;align-items:center;gap:12px;padding-top:5px;border-top:1px solid #e2e8f0">
      <span class="flabel" style="white-space:nowrap">Signature:</span>
      ${sigImg}
      <span style="flex:1"></span>
      <div><span class="flabel">Recommended next inspection</span><span class="fval">${front.next_inspection||"—"}</span></div>
    </div>
    <div style="margin-top:7px;padding-top:6px;border-top:1px solid #e2e8f0">
      <div style="font-size:7.5px;font-weight:700;color:#1e3a5f;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em">Reviewed by the Registered Qualified Supervisor</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0">
        <div><span class="flabel">Name</span><span class="fval">${profile?.company||"—"}</span></div>
        <div><span class="flabel">Position</span><span class="fval">Quality Supervisor</span></div>
        <div><span class="flabel">Signature</span><div style="width:120px;height:26px;border:1px solid #cbd5e1;margin-top:2px"></div></div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════
     PAGE 2 — OBSERVATIONS
════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="pg-header">
    <div><div class="pg-title">ELECTRICAL INSTALLATION CONDITION REPORT</div><div class="pg-sub">BS 7671:2018+A2:2022 &nbsp;·&nbsp; ${job?.jobNumber||""} &nbsp;·&nbsp; ${job?.address||""}</div></div>
    <div class="cert-box">Cert No.<br>${job?.jobNumber||"—"}</div>
  </div>

  <div class="sec">PART 5: OBSERVATIONS AND RECOMMENDATIONS FOR ACTIONS TO BE TAKEN</div>
  <div style="background:#fefce8;border:1px solid #fde047;padding:5px 8px;margin-bottom:5px;font-size:7.5px;line-height:1.5">
    <strong>CODES:</strong>
    &nbsp;<strong style="color:#c41c1c">C1</strong> — Danger Present: Risk of injury, immediate remedial action required.
    &nbsp;<strong style="color:#c2410c">C2</strong> — Potentially Dangerous: Urgent remedial action required.
    &nbsp;<strong style="color:#b45309">C3</strong> — Improvement Recommended.
    &nbsp;<strong style="color:#6d28d9">FI</strong> — Further Investigation Required without delay.
  </div>
  <div style="font-size:8px;margin-bottom:5px;padding:4px 6px;border:1px solid #e2e8f0;background:#f8fafc">
    Referring to the Schedule of Items Inspected (Part 9), the Schedule of Circuit Details and Test Results (Part 11), and subject to any agreed limitations listed in Part 6 —
    <strong>${obs.length===0?"No remedial action is required.":"The following observations are made:"}</strong>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:35px;text-align:center">Item No.</th>
        <th>Observation(s)</th>
        <th style="width:38px;text-align:center">Code</th>
        <th style="width:80px">Location</th>
        <th style="width:65px">Regulation Ref.</th>
      </tr>
    </thead>
    <tbody>${obsRows}</tbody>
  </table>
  <div class="counts" style="margin-top:8px">
    <div class="cbox" style="border-color:#fecaca"><div class="cnum" style="color:#c41c1c">${c1s.length}</div><div class="clbl">Number of C1</div></div>
    <div class="cbox" style="border-color:#fed7aa"><div class="cnum" style="color:#c2410c">${c2s.length}</div><div class="clbl">Number of C2</div></div>
    <div class="cbox" style="border-color:#fde68a"><div class="cnum" style="color:#b45309">${c3s.length}</div><div class="clbl">Number of C3</div></div>
    <div class="cbox" style="border-color:#ddd6fe"><div class="cnum" style="color:#6d28d9">${fis.length}</div><div class="clbl">Number of FI</div></div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════
     PAGE 3 — EXTENT, LIMITATIONS & SUPPLY
════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="pg-header">
    <div><div class="pg-title">ELECTRICAL INSTALLATION CONDITION REPORT</div><div class="pg-sub">BS 7671:2018+A2:2022 &nbsp;·&nbsp; ${job?.jobNumber||""} &nbsp;·&nbsp; ${job?.address||""}</div></div>
    <div class="cert-box">Cert No.<br>${job?.jobNumber||"—"}</div>
  </div>

  <div class="sec">PART 6: DETAILS AND LIMITATIONS ON THE INSPECTION AND TESTING</div>
  <div style="font-size:7.5px;color:#475569;padding:4px 8px;border:1px solid #e2e8f0;background:#f8fafc;margin-bottom:0;border-bottom:none">The inspection and testing has been carried out in accordance with BS 7671:2018+A2:2022. Cables concealed within trunking and conduits, or cables and conduits concealed under floors, in inaccessible roof spaces and generally within the fabric of the building or underground, have not been visually inspected unless specifically agreed between the Client and the Inspector prior to inspection.</div>
  <table style="margin:0">
    <tbody>
      <tr>
        <td style="width:160px;font-size:8px;color:#64748b;font-weight:600">Details of the electrical installation covered by this report</td>
        <td style="font-size:8.5px">${front.extent||"This report covers the inspection and testing of the fixed wiring system within the named property with the exception of any agreed or operational limitations as documented."}</td>
      </tr>
      <tr>
        <td style="font-size:8px;color:#64748b;font-weight:600">Agreed limitations including the reasons (Regulation 653.2)</td>
        <td style="font-size:8.5px">${agreedLimSummary}</td>
      </tr>
      <tr>
        <td style="font-size:8px;color:#64748b;font-weight:600">Operational limitations including the reasons</td>
        <td style="font-size:8.5px">${opLimSummary}</td>
      </tr>
      <tr>
        <td style="font-size:8px;color:#64748b;font-weight:600">Agreed with (print name)</td>
        <td style="font-size:8.5px;display:flex;gap:24px"><span>${front.agreed_with||"—"}</span><span style="margin-left:32px"><span class="flabel">Client representative (approved limitations)</span><span class="fval">${front.template_id==="riverside"?"Iain Hardman":"—"}</span></span></td>
      </tr>
    </tbody>
  </table>

  <div class="sec">PART 7: SUPPLY CHARACTERISTICS AND EARTHING ARRANGEMENTS</div>
  <div class="grid-3col">
    <div class="gcol">
      <div class="gcol-title">System type and earthing arrangements</div>
      ${[["TN-C",supply.earthing_tnc],["TN-S",supply.earthing_tns],["TN-C-S",supply.earthing_tncs],["TT",supply.earthing_tt],["IT",false]].map(([l,v])=>`<div class="kv"><span class="kv-k">${l}</span><span class="kv-v">${v?"✓":"N/A"}</span></div>`).join("")}
      <div style="margin-top:5px;padding-top:4px;border-top:1px solid #e2e8f0">
        <div class="gcol-title">Supply protective device</div>
        <div class="kv"><span class="kv-k">BS(EN)</span><span class="kv-v">${supply.supply_bs||"—"}</span></div>
        <div class="kv"><span class="kv-k">Type</span><span class="kv-v">${supply.supply_type||"—"}</span></div>
        <div class="kv"><span class="kv-k">Rated current</span><span class="kv-v">LIM A</span></div>
      </div>
    </div>
    <div class="gcol">
      <div class="gcol-title">Number and type of live conductors</div>
      ${[["AC 1-phase (2-wire)",supply.phases_1],["AC 2-phase (3-wire)",supply.phases_2],["AC 3-phase (3-wire)",supply.phases_3w],["AC 3-phase (4-wire)",supply.phases_3_4w]].map(([l,v])=>`<div class="kv"><span class="kv-k">${l}</span><span class="kv-v">${v?"✓":"N/A"}</span></div>`).join("")}
      <div class="kv" style="margin-top:4px"><span class="kv-k">Confirmation of supply polarity</span><span class="kv-v">${supply.polarity_confirmed?"✓":"—"}</span></div>
    </div>
    <div class="gcol" style="border-right:none">
      <div class="gcol-title">Nature of supply parameters</div>
      ${[["Nominal voltage Uo (V)",supply.voltage_uo||"230"],["Nominal frequency f (Hz)",supply.frequency||"50"],["Prospective fault current Ipf (kA)",supply.prospective_fault_current||"—"],["External earth fault loop Ze (Ω)",supply.external_ze||"—"]].map(([l,v])=>`<div class="kv"><span class="kv-k">${l}</span><span class="kv-v">${v}</span></div>`).join("")}
    </div>
  </div>

  <div class="sec">PART 8: PARTICULARS OF INSTALLATION REFERRED TO IN THIS REPORT</div>
  <div class="grid-3col">
    <div class="gcol">
      <div class="gcol-title">Means of Earthing</div>
      <div class="kv"><span class="kv-k">Distributor's facility</span><span class="kv-v">${tick(supply.distributor_facility)}</span></div>
      <div class="kv"><span class="kv-k">Installation earth electrode</span><span class="kv-v">${tick(supply.installation_electrode)}</span></div>
      <div style="margin-top:5px;padding-top:4px;border-top:1px solid #e2e8f0">
        <div class="gcol-title">Earthing Conductor</div>
        <div class="kv"><span class="kv-k">Material</span><span class="kv-v">${supply.earth_conductor_material||"Copper"}</span></div>
        <div class="kv"><span class="kv-k">CSA (mm²)</span><span class="kv-v">${supply.earth_conductor_csa||"—"}</span></div>
        <div class="kv"><span class="kv-k">Connection verified</span><span class="kv-v">${tick(supply.earth_conductor_verified)}</span></div>
        <div class="kv"><span class="kv-k">Continuity verified</span><span class="kv-v">${tick(supply.earth_conductor_verified)}</span></div>
      </div>
      <div style="margin-top:5px;padding-top:4px;border-top:1px solid #e2e8f0">
        <div class="gcol-title">Main Protective Bonding</div>
        <div class="kv"><span class="kv-k">Material</span><span class="kv-v">${supply.bonding_conductor_material||"Copper"}</span></div>
        <div class="kv"><span class="kv-k">CSA (mm²)</span><span class="kv-v">${supply.bonding_conductor_csa||"—"}</span></div>
        <div class="kv"><span class="kv-k">Water installation pipes</span><span class="kv-v">${tick(supply.bond_water)}</span></div>
        <div class="kv"><span class="kv-k">Gas installation pipes</span><span class="kv-v">${tick(supply.bond_gas)}</span></div>
        <div class="kv"><span class="kv-k">Oil installation pipes</span><span class="kv-v">${tick(supply.bond_oil)}</span></div>
        <div class="kv"><span class="kv-k">Lightning protection</span><span class="kv-v">${tick(supply.bond_lightning)}</span></div>
        <div class="kv"><span class="kv-k">Structural steel</span><span class="kv-v">${tick(supply.bond_steel)}</span></div>
      </div>
    </div>
    <div class="gcol">
      <div class="gcol-title">Main Switch / Switch-Fuse / Circuit-Breaker / RCD</div>
      ${[["Location",supply.main_switch_location||"—"],["BS(EN)",supply.main_switch_bs||"—"],["Type",supply.main_switch_type||"Isolator"],["No. of poles",supply.main_switch_poles||"—"],["Current rating (A)",supply.main_switch_rating||"—"],["Fuse/device rating",supply.main_switch_fuse_setting||"N/A"],["Voltage rating (V)",supply.main_switch_voltage||"230"]].map(([l,v])=>`<div class="kv"><span class="kv-k">${l}</span><span class="kv-v">${v}</span></div>`).join("")}
      ${supply.rcd_main?`<div style="margin-top:5px;padding-top:4px;border-top:1px solid #e2e8f0">
        <div class="gcol-title">Where RCD used as main switch</div>
        <div class="kv"><span class="kv-k">RCD Type</span><span class="kv-v">${supply.rcd_type||"—"}</span></div>
        <div class="kv"><span class="kv-k">Rated residual current IΔn (mA)</span><span class="kv-v">${supply.rcd_idelta||"—"}</span></div>
        <div class="kv"><span class="kv-k">Rated time delay (ms)</span><span class="kv-v">${supply.rcd_delay||"N/A"}</span></div>
        <div class="kv"><span class="kv-k">Measured operating time (ms)</span><span class="kv-v">${supply.rcd_measured||"N/A"}</span></div>
      </div>`:""}
    </div>
    <div class="gcol" style="border-right:none">
      <div class="gcol-title">Test Instruments Used (serial / cal. ref.)</div>
      ${[["Multifunction tester",supply.test_mft||"—"],["Insulation resistance",supply.test_ir||"—"],["Continuity",supply.test_continuity||"—"],["Earth fault loop impedance",supply.test_loop||"—"],["RCD tester",supply.test_rcd||"—"],["Earth electrode resistance",supply.test_electrode||"—"]].map(([l,v])=>`<div class="kv"><span class="kv-k">${l}</span><span class="kv-v">${v}</span></div>`).join("")}
      <div style="margin-top:5px;padding-top:4px;border-top:1px solid #e2e8f0">
        <div class="gcol-title">Engineer</div>
        <div class="kv"><span class="kv-k">Name</span><span class="kv-v">${profile?.full_name||job?.engineer||"—"}</span></div>
        <div class="kv"><span class="kv-k">Date</span><span class="kv-v">${job?.date||"—"}</span></div>
        <div style="margin-top:3px">${sigImg}</div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════
     PAGE 4 — INSPECTION SCHEDULE
════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="pg-header">
    <div><div class="pg-title">ELECTRICAL INSTALLATION CONDITION REPORT</div><div class="pg-sub">BS 7671:2018+A2:2022 &nbsp;·&nbsp; ${job?.jobNumber||""} &nbsp;·&nbsp; ${job?.address||""}</div></div>
    <div class="cert-box">Cert No.<br>${job?.jobNumber||"—"}</div>
  </div>
  <div class="sec">PART 9: SCHEDULE OF ITEMS INSPECTED</div>
  <div style="font-size:7.5px;color:#475569;padding:4px 8px;border:1px solid #e2e8f0;background:#f8fafc;border-bottom:none">
    All fields must be completed. Enter: <strong>✓</strong> if acceptable condition; <strong>N/A</strong> if not applicable; <strong>LIM</strong> if a limitation exists; or code <strong>C1, C2, C3</strong> or <strong>FI</strong> as appropriate.
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:52px">Item Ref</th>
        <th>Description</th>
        <th style="width:44px;text-align:center">Outcome</th>
      </tr>
    </thead>
    <tbody>${inspRows}</tbody>
  </table>
  <div style="margin-top:6px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0;padding-top:5px">
    <div style="font-size:8px"><strong>Schedule of items inspected by:</strong> &nbsp; ${profile?.full_name||job?.engineer||"—"} &nbsp;|&nbsp; ${job?.date||"—"}</div>
    ${sigImg}
  </div>
</div>

<!-- ═══════════════════════════════════════════════════════════
     PAGE 5 — CIRCUIT SCHEDULE
════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="pg-header">
    <div><div class="pg-title">PART 11: SCHEDULE OF CIRCUIT DETAILS AND TEST RESULTS</div><div class="pg-sub">BS 7671:2018+A2:2022 &nbsp;·&nbsp; ${job?.jobNumber||""} &nbsp;·&nbsp; ${job?.address||""}</div></div>
    <div class="cert-box">Cert No.<br>${job?.jobNumber||"—"}</div>
  </div>
  <div>
    <table style="width:100%;font-size:8px">
      <thead>
        <tr>
          <th rowspan="2" style="min-width:30px;text-align:center">Ref</th>
          <th rowspan="2" style="min-width:75px">Circuit Designation</th>
          <th rowspan="2">Type of Wiring</th>
          <th rowspan="2">Ref Method</th>
          <th rowspan="2">No. of Points</th>
          <th rowspan="2">CB Rating (A)</th>
          <th rowspan="2">CB Type</th>
          <th rowspan="2">CB BS No.</th>
          <th rowspan="2">RCD Type</th>
          <th rowspan="2">RCD (mA)</th>
          <th rowspan="2">Max Zs (Ω)</th>
          <th colspan="4" style="text-align:center;border-bottom:1px solid #fff">Continuity (Ω)</th>
          <th colspan="2" style="text-align:center;border-bottom:1px solid #fff">Insulation Resistance (MΩ)</th>
          <th rowspan="2">Polarity</th>
          <th rowspan="2">Zs Measured (Ω)</th>
          <th rowspan="2">RCD Op. Time (ms)</th>
          <th rowspan="2">AFDD</th>
        </tr>
        <tr>
          <th style="font-size:6.5px">R1+R2</th><th style="font-size:6.5px">R2</th><th style="font-size:6.5px">Rn</th><th style="font-size:6.5px">R1+R2 (ring)</th>
          <th style="font-size:6.5px">L-L</th><th style="font-size:6.5px">L-E</th>
        </tr>
      </thead>
      <tbody>${circRows}</tbody>
    </table>
  </div>
  <div style="margin-top:7px;padding:5px 6px;border:1px solid #e2e8f0;background:#f8fafc">
    <div style="font-size:7.5px;font-weight:700;margin-bottom:3px">CODES FOR TYPE OF WIRING:</div>
    <div style="font-size:7px;color:#64748b">(A) Thermoplastic insulated/sheathed cables &nbsp; (B) Thermoplastic in metallic conduit &nbsp; (C) Thermoplastic in non-metallic conduit &nbsp; (D) Thermoplastic in metallic trunking &nbsp; (E) Non-metallic trunking &nbsp; (F) Thermoplastic/SWA &nbsp; (G) Thermosetting/SWA &nbsp; (H) Mineral insulated</div>
  </div>
  <div style="margin-top:6px;font-size:8px;border-top:1px solid #e2e8f0;padding-top:5px">
    <strong>Tested by:</strong> ${profile?.full_name||job?.engineer||"—"} &nbsp;|&nbsp; <strong>Date:</strong> ${job?.date||"—"} &nbsp; ${sigImg}
  </div>
</div>

${selectedAgreed.length>0||selectedOp.length>0?`
<!-- ═══════════════════════════════════════════════════════════
     PAGE 6 — CONTINUATION SHEET: LIMITATIONS
════════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="pg-header">
    <div><div class="pg-title">ELECTRICAL INSTALLATION CONDITION REPORT</div><div class="pg-sub">BS 7671:2018+A2:2022 &nbsp;·&nbsp; ${job?.jobNumber||""} &nbsp;·&nbsp; ${job?.address||""}</div></div>
    <div class="cert-box">Cert No.<br>${job?.jobNumber||"—"}</div>
  </div>
  ${selectedAgreed.length>0?`
  <div class="sec">AGREED LIMITATIONS (INCLUDING THE REASONS)</div>
  <div class="grid-box" style="line-height:1.7;font-size:8.5px">
    ${selectedAgreed.map(({letter,text})=>`<p style="margin-bottom:8px"><strong>${letter}.</strong> ${text}</p>`).join("")}
  </div>`:""}
  ${selectedOp.length>0?`
  <div class="sec" style="margin-top:10px">OPERATIONAL LIMITATIONS (INCLUDING THE REASONS)</div>
  <div class="grid-box" style="line-height:1.7;font-size:8.5px">
    ${selectedOp.map(({num,text})=>`<p style="margin-bottom:8px"><strong>${num}.</strong> ${text}</p>`).join("")}
  </div>`:""}
</div>`:""}

</body>
</html>`;

  const win = window.open("","_blank");
  if(win){ win.document.write(html); win.document.close(); }
  else { alert("Pop-ups blocked — please allow pop-ups for this site and try again."); }
  } catch(err) {
    alert("Certificate error: "+err.message);
    console.error("EICR HTML error:",err);
  }
}


// - PROFILE SCREEN ----------------------

// - ROOT APP -----------------
export default function App() {
const [user,        setUser]        = useState(() => {
// Restore session from localStorage on reload
try {
const saved = localStorage.getItem("themis_user");
return saved ? JSON.parse(saved) : null;
} catch(e) { return null; }
});
const [screen,      setScreen]      = useState("login");
const [createJobKey, setCreateJobKey] = useState(0);
const [job,         setJob]         = useState(null);
const [asset,       setAsset]       = useState(null);
const [checklist,   setChecklist]   = useState(null);
const [testResults, setTestResults] = useState(null);
const [review,      setReview]      = useState(null);
const [reportType,     setReportType]     = useState(null);
const [conditionality, setConditionality] = useState(null);
const [saving,         setSaving]         = useState(false);
const [profile,        setProfile]        = useState(null);
const [eicrInstall,    setEicrInstall]    = useState(null);
const [eicrSupply,     setEicrSupply]     = useState(null);
const [eicrCircuits,   setEicrCircuits]   = useState(null);
const [eicrInspection, setEicrInspection] = useState(null);
const [eicrObservations,setEicrObservations] = useState(null);

const labels = {
dashboard:"Dashboard", create_job:"New Job", asset:"Asset Details",
checklist:"Checklist", test_results:"Test Results",
ai_review:"AI Review", conditionality:"Conditionality", summary:"Summary", report:"Report",
profile:"My Profile",
eicr_install:"Installation Details",
eicr_circuits:"Circuit Schedule",
eicr_inspection:"Visual Inspection",
eicr_observations:"Observations",
};

// - SAVE JOB TO SUPABASE ------------
const getValidToken = async () => {
  // Try to refresh if we have a refresh token
  if (user?.refreshToken) {
    try {
      const data = await sb.refreshSession(user.refreshToken);
      if (data.access_token) {
        const updated = { ...user, token: data.access_token, refreshToken: data.refresh_token };
        setUser(updated);
        try { localStorage.setItem("themis_user", JSON.stringify(updated)); } catch(e) {}
        return data.access_token;
      }
    } catch(e) { console.log("Token refresh failed:", e); }
  }
  return user?.token;
};

const saveJob = async (jobData) => {
setSaving(true);
try {
const token = await getValidToken();
const payload = {
job_number:    jobData.jobNumber,
user_id:       user.id,
client:        jobData.client,
address:       jobData.address,
mode:          jobData.mode,
status:        "open",
engineer_name: jobData.engineer,
date:          jobData.date,
flagged:       false,
limitations:   jobData.limitations || null,
};
const result = await sb.insert("jobs", token, payload);
if (result && result[0] && result[0].id) {
const saved = { ...jobData, id: result[0].id };
console.log("Job saved - Supabase ID:", result[0].id);
setJob(saved);
setAsset(null);
setChecklist(null);
setTestResults(null);
setReview(null);
setEicrInstall(null);
setEicrCircuits(null);
setEicrInspection(null);
setEicrObservations(null);
setSaving(false);
setScreen(saved.mode==="eicr"?"eicr_install":"asset");
return saved;
} else {
const errMsg = JSON.stringify(result);
console.error("Job insert failed:", errMsg);
alert("Save failed: " + errMsg);
setScreen("asset");
}
} catch(e) { console.error("Save job failed:", e); alert("Save error: " + e.message); }
setSaving(false);
};

// - SAVE ASSET TO SUPABASE -----------------
const saveAsset = async (assetData, jobIdOverride) => {
const jobId = jobIdOverride || job?.id;
if (!jobId) { setAsset(assetData); setScreen("checklist"); return; }
setSaving(true);
const payload = {
job_id:          jobId,
panel_count:     assetData.panel_count,
panel_make:      assetData.panel_make,
panel_model:     assetData.panel_model,
inverter_make:   assetData.inverter_make,
inverter_model:  assetData.inverter_model,
inverter_serial: assetData.inverter_serial,
inverter_loc:    assetData.inverter_loc,
dc_iso_loc:      assetData.dc_iso_loc,
ac_iso_loc:      assetData.ac_iso_loc,
meter_make:      assetData.meter_make,
meter_serial:    assetData.meter_serial,
meter_reading:   assetData.meter_reading,
system_age:      assetData.system_age,
inverter_specs:  assetData.inverterSpecs || null,
panel_specs:     assetData.panelSpecs || null,
};
// Save in background - don't block navigation
sb.upsert("solar_assets", await getValidToken(), payload, "job_id")
.then(r => { 
  if(r && r[0]) console.log("Asset saved ok");
  else alert("Asset save issue: " + JSON.stringify(r).slice(0,200));
})
.catch(e => alert("Asset save error: " + e.message));
setAsset(assetData);
setSaving(false);
setScreen(job?.mode === "diagnostic" ? "ai_review" : "checklist");
};

// - SAVE CHECKLIST TO SUPABASE ----------
const saveChecklist = async (checklistData) => {
const jobId = job?.id;
if (!jobId) { setChecklist(checklistData); setScreen("test_results"); return; }
setSaving(true);
setChecklist(checklistData);
setScreen("test_results");
// Save in background - don't block navigation. Upload photos then save rows with URLs.
(async () => {
  try {
    const token = await getValidToken();
    const rows = [];
    for (const [itemId, val] of Object.entries(checklistData)) {
      const photos = val.photos || [];
      const photoUrls = [];
      for (const p of photos) {
        // If already a stored URL (starts with http), keep it. Otherwise upload the dataUrl.
        if (p.url) { photoUrls.push({ id: p.id, url: p.url, name: p.name }); continue; }
        if (p.dataUrl && p.dataUrl.startsWith("data:")) {
          const fname = (p.id + "_" + (p.name || "photo.jpg")).replace(/[^a-zA-Z0-9._-]/g, "_");
          const url = await sb.uploadPhoto(token, jobId, itemId, p.dataUrl, fname).catch(()=>null);
          if (url) photoUrls.push({ id: p.id, url, name: p.name });
          else photoUrls.push({ id: p.id, dataUrl: p.dataUrl, name: p.name }); // fallback keep dataUrl
        }
      }
      rows.push({
        job_id:  jobId,
        item_id: itemId,
        answer:  val.answer || null,
        value:   val.value  || null,
        note:    val.note   || null,
        risk:    val.risk   || null,
        photos:  photoUrls.length ? photoUrls : null,
      });
    }
    for (let i = 0; i < rows.length; i += 20) {
      await sb.upsert("checklist_answers", token, rows.slice(i, i+20), "job_id,item_id").catch(e => console.error("Checklist batch error:", e));
    }
    console.log("Checklist + photos saved");
  } catch(e) { console.error("Checklist save failed:", e); }
})();
setSaving(false);
};

// - SAVE TEST RESULTS TO SUPABASE -------------
const saveTestResults = async (trData) => {
const jobId = job?.id;
if (!jobId) { setTestResults(trData); setScreen("ai_review"); return; }
setSaving(true);
setTestResults(trData);
// Save then navigate — surface errors so a failed save is visible
(async () => {
  try {
    await sb.upsert("test_results", await getValidToken(), {
      job_id:       jobId,
      voc:          trData.voc,
      isc:          trData.isc,
      irradiance:   trData.irradiance,
      ir_pos:       trData.ir_pos,
      ir_neg:       trData.ir_neg,
      polarity:     trData.polarity,
      zs:           trData.zs,
      rcd_type:     trData.rcd_type,
      rcd_trip:     trData.rcd_trip,
      mcb_rating:   trData.mcb_rating,
      breaking_cap: trData.breaking_cap,
      ocpd_bs:      trData.ocpd_bs,
      ocpd_type:    trData.ocpd_type,
      switchgear:   trData.switchgear,
      inverter_ok:  trData.inverter_ok,
      loss_mains:   trData.loss_mains,
    }, "job_id");
    console.log("Test results saved");
  } catch(e) {
    console.error("Test results save error:", e);
    alert("Warning: test results may not have saved — " + (e?.message || "check connection") + ". Your entries are kept on screen; tap AI Review again or check Supabase columns.");
  }
})();
setSaving(false);
setScreen("ai_review");
};

// - SAVE AI REVIEW TO SUPABASE ----------
const saveReview = async (reviewData) => {
const jobId = job?.id;
if (!jobId) { setReview(reviewData); setScreen("conditionality"); return; }
setSaving(true);
// Save in background
sb.upsert("ai_reviews", await getValidToken(), {
job_id:              jobId,
overall_status:      reviewData.overall_status,
summary:             reviewData.summary,
missing_information: reviewData.missing_information || [],
risk_items:          reviewData.risk_items || [],
recommended_actions: reviewData.recommended_actions || [],
next_inspection:     reviewData.next_inspection,
tags:                reviewData.tags || [],
engineer_notes:      reviewData.engineer_notes || null,
}, "job_id").catch(e => console.error("Review save error:", e));
sb.update("jobs", await getValidToken(),
{ status: "completed", flagged: (reviewData.risk_items||[]).some(r=>r.code==="C2") },
"id=eq." + jobId
).catch(e => console.error("Job update error:", e));
setReview(reviewData);
setSaving(false);
setScreen("conditionality");
};

// - SAVE EICR FRONT SHEET ---------------
const saveEicrFrontSheet = async (data) => {
  const jobId = job?.id;
  if(!jobId) { setEicrInstall(data); setScreen("eicr_supply"); return; }
  setSaving(true);
  const token = await getValidToken();
  sb.upsert("eicr_installation", token, { job_id: jobId, front_sheet: JSON.stringify(data) }, "job_id")
    .catch(e => console.error("EICR front sheet save error:", e));
  setEicrInstall(data);
  setSaving(false);
  setScreen("eicr_supply");
};

// - SAVE EICR SUPPLY --------------------
const saveEicrSupply = async (data) => {
  const jobId = job?.id;
  if(!jobId) { setEicrSupply(data); setScreen("eicr_circuits"); return; }
  setSaving(true);
  const token = await getValidToken();
  sb.upsert("eicr_installation", token, { job_id: jobId, supply_data: JSON.stringify(data) }, "job_id")
    .catch(e => console.error("EICR supply save error:", e));
  setEicrSupply(data);
  setSaving(false);
  setScreen("eicr_circuits");
};

// - SAVE EICR CIRCUITS -------------------
const saveEicrCircuits = async (data) => {
  const circuits = data?.circuits || data;
  const jobId = job?.id;
  if(!jobId) { setEicrCircuits(data); setScreen("eicr_inspection"); return; }
  setSaving(true);
  const token = await getValidToken();
  // Delete existing circuits then re-insert
  try {
    await fetch(SUPABASE_URL + "/rest/v1/eicr_circuits?job_id=eq." + jobId, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + token }
    });
    if(circuits.length > 0) {
      const rows = circuits.map((c, i) => ({ job_id: jobId, ...c, sort_order: i }));
      await sb.insert("eicr_circuits", token, rows);
    }
  } catch(e) { alert("Circuit save error: " + e.message); }
  setEicrCircuits(circuits);
  setSaving(false);
  setScreen("eicr_inspection");
};

// - SAVE EICR INSPECTION -----------------
const saveEicrInspection = async (answers) => {
  const jobId = job?.id;
  if(!jobId) { setEicrInspection(answers); setScreen("eicr_observations"); return; }
  setSaving(true);
  const token = await getValidToken();
  const rows = Object.entries(answers).map(([item_id, v]) => ({
    job_id: jobId, item_id, answer: v.answer||null, note: v.note||null
  }));
  // Save in batches of 20
  for(let i=0; i<rows.length; i+=20) {
    await sb.upsert("checklist_answers", token, rows.slice(i,i+20), "job_id,item_id")
      .catch(e => console.error("EICR inspection save error:", e));
  }
  setEicrInspection(answers);
  setSaving(false);
  setScreen("eicr_observations");
};

// - SAVE EICR OBSERVATIONS ---------------
const saveEicrObservations = async (observations) => {
  const jobId = job?.id;
  if(!jobId) { setEicrObservations(observations); setScreen("eicr_summary"); return; }
  setSaving(true);
  const token = await getValidToken();
  try {
    await fetch(SUPABASE_URL + "/rest/v1/eicr_observations?job_id=eq." + jobId, {
      method: "DELETE",
      headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + token }
    });
    if(observations.length > 0) {
      const rows = observations.map((o, i) => ({ job_id: jobId, ...o, sort_order: i }));
      await sb.insert("eicr_observations", token, rows);
    }
  } catch(e) { alert("Observations save error: " + e.message); }
  setEicrObservations(observations);
  setSaving(false);
  // Build auto review from observations
  const c1s = observations.filter(o=>o.code==="C1");
  const c2s = observations.filter(o=>o.code==="C2");
  const c3s = observations.filter(o=>o.code==="C3");
  const fis = observations.filter(o=>o.code==="FI");
  // Also check inspection checklist for C1/C2 outcomes
  const inspC1 = eicrInspection ? Object.values(eicrInspection).filter(v=>v.answer==="c1").length : 0;
  const inspC2 = eicrInspection ? Object.values(eicrInspection).filter(v=>v.answer==="c2").length : 0;
  const inspC3 = eicrInspection ? Object.values(eicrInspection).filter(v=>v.answer==="c3").length : 0;
  const inspFI = eicrInspection ? Object.values(eicrInspection).filter(v=>v.answer==="fi").length : 0;
  const totalC1 = c1s.length + inspC1;
  const totalC2 = c2s.length + inspC2;
  const totalC3 = c3s.length + inspC3;
  const totalFI = fis.length + inspFI;
  const status = totalC1>0||totalC2>0?"Unsatisfactory":"Satisfactory";
  const autoReview = {
    overall_status: status,
    summary: `EICR completed for ${job?.client||"client"} at ${job?.address||"address"}. Overall assessment: ${status}. ${observations.length} formal observation(s) recorded: ${totalC1} C1 (danger present), ${totalC2} C2 (potentially dangerous), ${totalC3} C3 (improvement recommended), ${totalFI} FI (further investigation required).`,
    risk_items: observations.map(o=>({ code:o.code, issue:o.description, regulation:o.regulation, recommended_action:o.recommendation })),
    next_inspection: c1s.length>0||c2s.length>0?"Immediate remedial works required":c3s.length>0?"Recommended within 12 months":"5 years (domestic) or as required by tenure",
    tags: [],
    missing_information: [],
    recommended_actions: [],
  };
  setReview(autoReview);
  setScreen("eicr_summary");
};


// - LOAD FULL JOB DATA FROM SUPABASE -----------
// Test Supabase connection
const testSupabase = async () => {
try {
const res = await fetch("https://mvratboyodudbgcmwtku.supabase.co/rest/v1/solar_assets?limit=1", {
headers: {
"apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmF0Ym95b2R1ZGJnY213dGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTU0ODUsImV4cCI6MjA5Mjc5MTQ4NX0.2GQaY76N9KKXkKBxRU5ZCzthttUh49WM0J2Pd1QJw4U",
"Authorization": "Bearer " + user.token,
}
});
const text = await res.text();
console.log("Supabase test - status:", res.status, "body:", text.slice(0,200));
} catch(e) {
console.error("Supabase test failed:", e.message);
}
};

const loadJobData = async (j) => {
setJob(j);
setAsset(null); setChecklist(null); setTestResults(null); setReview(null);
setEicrInstall(null); setEicrSupply(null); setEicrCircuits(null); setEicrInspection(null); setEicrObservations(null);
setScreen("loading");

try {
  const token = await getValidToken();

  // Load asset
  const assetData = await sb.query("solar_assets", token, {
    select: "*",
    filter: `job_id=eq.${j.id}`,
    limit: 1,
  });

  // Load checklist answers
  const clData = await sb.query("checklist_answers", token, {
    select: "*",
    filter: `job_id=eq.${j.id}`,
    limit: 200,
  });

  // Load test results
  const trData = await sb.query("test_results", token, {
    select: "*",
    filter: `job_id=eq.${j.id}`,
    limit: 1,
  });

  // Load AI review
  const revData = await sb.query("ai_reviews", token, {
    select: "*",
    filter: `job_id=eq.${j.id}`,
    limit: 1,
  });

  // Parse asset
  const asset = assetData?.[0] ? {
    panel_count:     assetData[0].panel_count,
    panel_make:      assetData[0].panel_make,
    panel_model:     assetData[0].panel_model,
    inverter_make:   assetData[0].inverter_make,
    inverter_model:  assetData[0].inverter_model,
    inverter_serial: assetData[0].inverter_serial,
    inverter_loc:    assetData[0].inverter_loc,
    dc_iso_loc:      assetData[0].dc_iso_loc,
    ac_iso_loc:      assetData[0].ac_iso_loc,
    meter_make:      assetData[0].meter_make,
    meter_serial:    assetData[0].meter_serial,
    meter_reading:   assetData[0].meter_reading,
    system_age:      assetData[0].system_age,
    inverterSpecs:   assetData[0].inverter_specs,
    panelSpecs:      assetData[0].panel_specs,
  } : null;

  // Parse checklist - convert flat rows back to keyed object
  const checklist = {};
  if (Array.isArray(clData)) {
    clData.forEach(row => {
      // Reconstruct photos from stored URLs
      let photos = [];
      if (row.photos) {
        try {
          const parsed = typeof row.photos === "string" ? JSON.parse(row.photos) : row.photos;
          photos = (parsed || []).map(p => ({
            id: p.id || (Date.now()+Math.random()),
            dataUrl: p.url || p.dataUrl,  // use stored URL as the img src
            url: p.url || undefined,
            name: p.name,
          }));
        } catch(e) { photos = []; }
      }
      checklist[row.item_id] = {
        answer: row.answer || undefined,
        value:  row.value  || undefined,
        note:   row.note   || undefined,
        risk:   row.risk   || undefined,
        photos,
      };
    });
  }

  // Parse test results
  const tr = trData?.[0] ? {
    voc:          trData[0].voc,
    isc:          trData[0].isc,
    irradiance:   trData[0].irradiance,
    ir_pos:       trData[0].ir_pos,
    ir_neg:       trData[0].ir_neg,
    polarity:     trData[0].polarity,
    zs:           trData[0].zs,
    rcd_type:     trData[0].rcd_type,
    rcd_trip:     trData[0].rcd_trip,
    mcb_rating:   trData[0].mcb_rating,
    breaking_cap: trData[0].breaking_cap,
    ocpd_bs:      trData[0].ocpd_bs,
    ocpd_type:    trData[0].ocpd_type,
    switchgear:   trData[0].switchgear,
    inverter_ok:  trData[0].inverter_ok,
    loss_mains:   trData[0].loss_mains,
  } : null;

  // Parse review
  const review = revData?.[0] ? {
    overall_status:      revData[0].overall_status,
    summary:             revData[0].summary,
    missing_information: revData[0].missing_information || [],
    risk_items:          revData[0].risk_items || [],
    recommended_actions: revData[0].recommended_actions || [],
    next_inspection:     revData[0].next_inspection,
    tags:                revData[0].tags || [],
    engineer_notes:      revData[0].engineer_notes || null,
  } : null;

  setAsset(asset);
  setChecklist(Object.keys(checklist).length > 0 ? checklist : null);
  setTestResults(tr);
  setReview(review);

  // Navigate to appropriate screen
  if(j.mode === "eicr") {
    // Load EICR specific data
    const eicrInstData = await sb.query("eicr_installation", token, { select:"*", filter:`job_id=eq.${j.id}`, limit:1 });
    const eicrCircData = await sb.query("eicr_circuits", token, { select:"*", filter:`job_id=eq.${j.id}`, limit:100 });
    const eicrObsData  = await sb.query("eicr_observations", token, { select:"*", filter:`job_id=eq.${j.id}`, limit:100 });
    if(eicrInstData?.[0]) setEicrInstall(eicrInstData[0]);
    if(eicrCircData?.length) setEicrCircuits(eicrCircData);
    if(Object.keys(checklist).length>0) setEicrInspection(checklist);
    if(eicrObsData?.length) setEicrObservations(eicrObsData);
    if(review) setScreen("eicr_summary");
    else if(eicrObsData?.length) setScreen("eicr_observations");
    else if(Object.keys(checklist).length>0) setScreen("eicr_inspection");
    else if(eicrCircData?.length) setScreen("eicr_circuits");
    else if(eicrInstData?.[0]) setScreen("eicr_install");
    else setScreen("eicr_install");
  } else {
    if (review) {
      setScreen("summary");
    } else if (tr) {
      setScreen("ai_review");
    } else if (Object.keys(checklist).length > 0) {
      setScreen("test_results");
    } else if (asset) {
      setScreen("checklist");
    } else {
      setScreen("asset");
    }
  }

} catch(e) {
  console.error("Load job data failed:", e);
  setScreen("asset");
}

};

const handleLogout = async () => {
if (user?.token) await sb.signOut(user.token).catch(()=>{});
try { localStorage.removeItem("themis_user"); } catch(e) {}
setUser(null);
setJob(null);
setAsset(null);
setChecklist(null);
setTestResults(null);
setReview(null);
setScreen("login");
};

return (
<div style={S.app}>
<style>{`*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}input,textarea{outline:none}textarea{resize:vertical}`}</style>

  {screen!=="login" && (
    <div style={S.header}>
      <div style={S.logo}><span style={{filter:`drop-shadow(0 0 6px ${C.green})`}}>⚡</span> THEMIS</div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        {saving && <span style={{fontSize:10,color:"rgba(255,255,255,0.7)"}}>saving...</span>}
        {labels[screen] && <span style={{fontSize:10,color:"rgba(255,255,255,0.6)",letterSpacing:"0.1em"}}>{labels[screen].toUpperCase()}</span>}
        <button onClick={()=>setScreen("template_manager")} style={{background:"none",border:"1px solid rgba(255,255,255,0.3)",color:"rgba(255,255,255,0.7)",borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>⚙️</button>
        <button onClick={()=>setScreen("profile")} style={{background:"none",border:"1px solid rgba(255,255,255,0.3)",color:"rgba(255,255,255,0.7)",borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>👤</button>
        <button onClick={handleLogout} style={{background:"none",border:"1px solid rgba(255,255,255,0.3)",color:"rgba(255,255,255,0.7)",borderRadius:6,padding:"4px 10px",fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>OUT</button>
      </div>
    </div>
  )}

  <div style={{paddingBottom:40}}>
    {screen==="loading" && (
      <div style={{padding:40,textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:16}}>⚡</div>
        <div style={{fontSize:14,color:C.green,fontWeight:700,marginBottom:8}}>Loading job data...</div>
        <div style={{fontSize:11,color:C.muted}}>Fetching from Supabase</div>
      </div>
    )}
    {screen==="login" && (
      <LoginScreen onLogin={u=>{
        try { localStorage.setItem("themis_user", JSON.stringify(u)); } catch(e) {}
        setUser(u);
        // Load engineer profile
        sb.query("engineer_profiles", u.token, {select:"*",filter:"user_id=eq."+u.id,limit:1})
          .then(d=>{ if(d&&d[0]) setProfile(d[0]); })
          .catch(()=>{});
        setScreen("dashboard");
      }}/>
    )}
    {screen==="dashboard" && (
      <Dashboard
        user={user}
        onCreateJob={()=>{
          setJob(null); setAsset(null); setChecklist(null);
          setTestResults(null); setReview(null);
          setCreateJobKey(k=>k+1); setScreen("create_job");
        }}
        onSelectJob={j=>{ loadJobData(j); }}
      />
    )}
    {screen==="create_job" && (
      <CreateJobScreen
        key={createJobKey}
        onBack={()=>setScreen("dashboard")}
        onCreate={saveJob}
      />
    )}
    {screen==="asset" && (
      <AssetScreen
        key={job?.id||"new"}
        job={job}
        initialData={asset}
        onBack={()=>setScreen("dashboard")}
        onNext={saveAsset}
      />
    )}
    {screen==="checklist" && (
      <ChecklistScreen
        key={job?.id||"new"}
        job={job}
        asset={asset}
        initialData={checklist}
        onBack={()=>setScreen("asset")}
        onNext={saveChecklist}
      />
    )}
    {screen==="test_results" && (
      <TestResultsScreen
        key={job?.id||"new"}
        initialData={testResults}
        onBack={()=>setScreen("checklist")}
        onNext={saveTestResults}
      />
    )}
    {screen==="ai_review" && (
      <AIReviewScreen
        job={job} asset={asset} checklist={checklist} testResults={testResults}
        profile={profile}
        onBack={()=>setScreen("test_results")}
        onComplete={saveReview}
      />
    )}
    {screen==="conditionality" && (
      <ConditionalityScreen
        job={job} asset={asset} checklist={checklist} review={review}
        onBack={()=>setScreen("ai_review")}
        onDone={()=>setScreen("summary")}
      />
    )}
    {screen==="summary" && (
      <SummaryScreen
        job={job} review={review}
        onBack={()=>setScreen("conditionality")}
        onReport={t=>{setReportType(t);setScreen("report");}}
      />
    )}
    {screen==="report" && (
      <ReportScreen
        job={job} asset={asset} checklist={checklist}
        testResults={testResults} review={review}
        type={reportType}
        profile={profile}
        onDone={()=>setScreen("dashboard")}
      />
    )}
    {screen==="eicr_install" && (
      <EICRFrontSheetScreen
        key={job?.id||"new"}
        job={job}
        initialData={eicrInstall}
        onBack={()=>setScreen("dashboard")}
        onNext={saveEicrFrontSheet}
      />
    )}
    {screen==="eicr_supply" && (
      <EICRSupplyScreen
        key={job?.id||"new"}
        job={job}
        initialData={eicrSupply}
        onBack={()=>setScreen("eicr_install")}
        onNext={saveEicrSupply}
      />
    )}
    {screen==="eicr_circuits" && (
      <EICRCircuitScreen
        key={job?.id||"new"}
        job={job}
        initialData={eicrCircuits}
        onBack={()=>setScreen("eicr_supply")}
        onNext={saveEicrCircuits}
      />
    )}
    {screen==="eicr_inspection" && (
      <EICRInspectionScreen
        key={job?.id||"new"}
        job={job}
        initialData={eicrInspection}
        onBack={()=>setScreen("eicr_circuits")}
        onNext={saveEicrInspection}
      />
    )}
    {screen==="eicr_observations" && (
      <EICRObservationsScreen
        job={job}
        initialData={eicrObservations}
        onBack={()=>setScreen("eicr_inspection")}
        onNext={saveEicrObservations}
      />
    )}
    {screen==="eicr_summary" && (
      <EICRSummaryScreen
        job={job}
        eicrInstall={eicrInstall}
        eicrSupply={eicrSupply}
        eicrCircuits={eicrCircuits}
        eicrInspection={eicrInspection}
        eicrObservations={eicrObservations}
        profile={profile}
        onBack={()=>setScreen("eicr_observations")}
        onGeneratePDF={()=>generateEICRHTML(job, eicrInstall, eicrSupply, eicrCircuits, eicrInspection, eicrObservations, profile)}
      />
    )}
    {screen==="profile" && (
      <ProfileScreen
        user={user}
        profile={profile}
        onSave={async (p)=>{
          const token = await getValidToken();
          const payload={user_id:user.id,...p};
          const existing=await sb.query("engineer_profiles",token,{select:"id",filter:"user_id=eq."+user.id,limit:1});
          if(existing&&existing[0]){
            await sb.update("engineer_profiles",token,p,"user_id=eq."+user.id);
          } else {
            await sb.insert("engineer_profiles",token,payload);
          }
          setProfile({...payload});
          setScreen("dashboard");
        }}
        onBack={()=>setScreen("dashboard")}
      />
    )}
    {screen==="template_manager" && (
      <TemplateManagerScreen
        onBack={()=>setScreen("dashboard")}
      />
    )}
    {!["login","loading","dashboard","create_job","asset","checklist","test_results","ai_review","conditionality","summary","report","profile","template_manager","eicr_install","eicr_supply","eicr_circuits","eicr_inspection","eicr_observations","eicr_summary"].includes(screen) && (
      <div style={{padding:32,textAlign:"center"}}>
        <div style={{color:"#00e887",fontSize:14,marginBottom:16}}>Unknown screen: {screen}</div>
        <button style={{...S.btn("primary")}} onClick={()=>setScreen("dashboard")}>Go to Dashboard</button>
      </div>
    )}
  </div>
</div>

);
}
// - CONDITIONALITY SCREEN ------------
const COMPONENT_LIFE = {
inverter:   { label:"Inverter",         expected:12, replace:"10-15 years" },
panels:     { label:"Solar Panels",     expected:28, replace:"25-30 years" },
dc_iso:     { label:"DC Isolator",      expected:18, replace:"15-20 years" },
ac_iso:     { label:"AC Isolator",      expected:18, replace:"15-20 years" },
rcd:        { label:"RCD / Protection", expected:15, replace:"12-18 years" },
wiring:     { label:"DC Wiring",        expected:25, replace:"20-30 years" },
mounting:   { label:"Mounting System",  expected:25, replace:"20-25 years" },
meter:      { label:"Generation Meter", expected:20, replace:"15-25 years" },
};

function ConditionalityScreen({ job, asset, checklist, review, onBack, onDone }) {
const age = parseInt(asset?.system_age||"0")||0;

const getCondition = (component) => {
const life = COMPONENT_LIFE[component];
const pct = age / life.expected;
if (pct < 0.4) return { rating:1, label:"Excellent",   col:"#059669", yrs:`${Math.round((life.expected*0.4)-age)}-${Math.round((life.expected*0.6)-age)} yrs` };
if (pct < 0.6) return { rating:2, label:"Good",        col:"#0284c7", yrs:`${Math.round((life.expected*0.6)-age)}-${Math.round((life.expected*0.8)-age)} yrs` };
if (pct < 0.8) return { rating:3, label:"Monitor",     col:"#d97706", yrs:`${Math.round((life.expected*0.8)-age)}-${Math.round(life.expected-age)} yrs` };
if (pct < 1.0) return { rating:4, label:"Attention",   col:"#ea580c", yrs:`0-${Math.round(life.expected-age)} yrs` };
return                { rating:5, label:"End of Life", col:"#dc2626", yrs:"Overdue" };
};

// Overall rating = worst component
const ratings = Object.keys(COMPONENT_LIFE).map(k => getCondition(k).rating);
const overall = Math.max(...ratings);
const overallCol = overall<=1?"#059669":overall<=2?"#0284c7":overall<=3?"#d97706":overall<=4?"#ea580c":"#dc2626";
const overallLabel = overall<=1?"Excellent":overall<=2?"Good":overall<=3?"Monitor":overall<=4?"Attention Required":"End of Life";

// Ratings key
const RATINGS = [
{r:1,col:"#059669",label:"Excellent",   desc:"No action required"},
{r:2,col:"#0284c7",label:"Good",        desc:"Routine maintenance only"},
{r:3,col:"#d97706",label:"Monitor",     desc:"Components approaching mid-life"},
{r:4,col:"#ea580c",label:"Attention",   desc:"Replacements forecast within 3 years"},
{r:5,col:"#dc2626",label:"End of Life", desc:"Immediate replacement recommended"},
];

return (
<div style={{padding:16}}>
<div style={S.secTitle}>* System Conditionality Assessment</div>

  {/* System age banner */}
  <div style={{...S.card,background:"#1e3a5f",marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:2}}>SYSTEM AGE</div>
        <div style={{fontSize:28,fontWeight:700,color:"#ffffff"}}>{age} years</div>
      </div>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:2}}>OVERALL RATING</div>
        <div style={{fontSize:32,fontWeight:800,color:overallCol}}>{overall}</div>
        <div style={{fontSize:10,color:overallCol,fontWeight:700}}>{overallLabel.toUpperCase()}</div>
      </div>
    </div>
  </div>

  {/* Component table */}
  <div style={{...S.card,padding:0,overflow:"hidden"}}>
    <div style={{background:"#1e3a5f",padding:"10px 14px",display:"grid",gridTemplateColumns:"1fr 60px 80px 80px",gap:8}}>
      {["COMPONENT","AGE","RATING","EST. REMAINING"].map(h=>(
        <div key={h} style={{fontSize:9,fontWeight:700,color:"rgba(255,255,255,0.7)",letterSpacing:"0.06em"}}>{h}</div>
      ))}
    </div>
    {Object.entries(COMPONENT_LIFE).map(([key,comp],i)=>{
      const cond = getCondition(key);
      return (
        <div key={key} style={{
          display:"grid",gridTemplateColumns:"1fr 60px 80px 80px",
          gap:8,padding:"10px 14px",
          background:i%2===0?"#ffffff":"#f8fafc",
          borderBottom:"1px solid #e2e8f0"
        }}>
          <div style={{fontSize:13,color:"#1e293b",fontWeight:500}}>{comp.label}</div>
          <div style={{fontSize:13,color:"#64748b"}}>{age} yrs</div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:24,height:24,borderRadius:"50%",background:cond.col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:800}}>{cond.rating}</div>
            <span style={{fontSize:10,color:cond.col,fontWeight:600}}>{cond.label}</span>
          </div>
          <div style={{fontSize:11,color:"#64748b"}}>{cond.yrs}</div>
        </div>
      );
    })}
  </div>

  {/* Ratings key */}
  <div style={{...S.card,marginTop:4}}>
    <div style={{fontSize:11,color:"#1e3a5f",fontWeight:700,marginBottom:10,letterSpacing:"0.06em"}}>RATING KEY</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
      {RATINGS.map(({r,col,label,desc})=>(
        <div key={r} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 8px",background:"#f8fafc",borderRadius:6,border:"1px solid #e2e8f0"}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:col,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:800,flexShrink:0}}>{r}</div>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#1e293b"}}>{label}</div>
            <div style={{fontSize:9,color:"#64748b"}}>{desc}</div>
          </div>
        </div>
      ))}
    </div>
  </div>

  {/* Disclaimer */}
  <div style={{...S.card,background:"#fef9ec",border:"1px solid #fde68a",marginTop:4}}>
    <div style={{fontSize:10,color:"#92400e",fontWeight:700,marginBottom:4}}>IMPORTANT - INDICATIVE FORECAST ONLY</div>
    <div style={{fontSize:10,color:"#78350f",lineHeight:1.6}}>
      This conditionality assessment is based on typical component lifespans and visual inspection at the time of visit.
      Actual replacement timelines may vary depending on usage, maintenance history and environmental conditions.
      This assessment does not constitute a guarantee of component performance, structural survey or specialist report.
      Themis Diagnostics and the inspecting engineer accept no liability for component failure outside of the stated inspection findings.
    </div>
  </div>

  <button style={S.btn("primary")} onClick={onDone}>Continue to Summary -></button>
  <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
</div>

);
}