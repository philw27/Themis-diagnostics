// Themis Diagnostics v3.1 - build 2
import { useState, useRef, useCallback, useEffect } from "react";

// -- SUPABASE CLIENT -----------------------------------------
const SUPABASE_URL = "https://mvratboyodudbgcmwtku.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cmF0Ym95b2R1ZGJnY213dGt1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTU0ODUsImV4cCI6MjA5Mjc5MTQ4NX0.2GQaY76N9KKXkKBxRU5ZCzthttUh49WM0J2Pd1QJw4U";

const sb = {
  // -- AUTH --------------------------------------------------
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

  // -- DATABASE ----------------------------------------------
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
    const text = await res.text();
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

// -- CHECKLIST DATA ------------------------------------------
const SECTIONS = [
  { id:"panels", label:"Solar Panels", items:[
    {id:"sp1",q:"Orientation of solar panels",type:"select",opts:["South","South-East","South-West","East","West","Flat roof"]},
    {id:"sp2",q:"Number of solar panels",type:"number"},
    {id:"sp3",q:"Location of solar panels",type:"select",opts:["Front","Rear","Side","Flat roof","Ground mount"]},
    {id:"sp4",q:"Are the panels damaged?"},
    {id:"sp5",q:"Are the panels clean / clear of debris?"},
    {id:"sp6",q:"Can the panel make be identified?"},
    {id:"sp7",q:"Do PV array cables appear to be secure?"},
    {id:"sp8",q:"Has array frame equipotential bonding been installed? (IEC 60364-7-712)"},
    {id:"sp9",q:"Is there evidence of bird / pest damage or fouling?"},
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

// -- PHOTO CAPTURE -------------------------------------------
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

// -- LOCAL AI ENGINE -----------------------------------------
function runAnalysis(job, asset, checklist, testResults, flaggedItems) {
  const risks = [], missing = [], actions = [];
  const a = checklist || {};
  const tr = testResults || {};
  const ast = asset || {};

  const ans  = id => a[id]?.answer || null;
  const val  = id => a[id]?.value  || "";
  const pics = id => (a[id]?.photos || []).length;
  const isNA = id => ans(id) === "na";

  // -- ASSET / SERIAL NUMBERS ------------------------------
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

  // -- PHOTO EVIDENCE --------------------------------------
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

  // -- UNANSWERED YES/NO ITEMS -----------------------------
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

  // -- TEST RESULTS ----------------------------------------
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

  // -- SPEC COMPARISON ----------------------------------------
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

  // -- COMPLIANCE BASELINE ---------------------------------
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

  // -- FLAGGED ITEMS ---------------------------------------
  const handled = ["inv5","inv8","inv9","iso7","ac4","ac5","lab3","lab4","lab6","sp8","mec4"];
  (flaggedItems||[]).forEach(item => {
    if (handled.includes(item.id)) return;
    const code = item.risk || (item.answer === "no" ? "C3" : "FI");
    risks.push({code, issue:"Failed: "+(item.id||"item")+(item.note?" - "+item.note:""), regulation:"BS 7671", recommended_action:"Inspect and remediate as required"});
  });

  // -- STATUS ----------------------------------------------
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

// -- ANSWER ROW ----------------------------------------------
function AnswerRow({ value, onChange }) {
  return (
    <div style={{display:"flex",gap:5}}>
      {ANSWER_OPTS.map(opt => {
        const sel = value === opt.val;
        return <button key={opt.val} onClick={()=>onChange(sel?null:opt.val)} style={{flex:1,padding:"8px 0",fontSize:11,fontWeight:700,borderRadius:7,border:`1.5px solid ${sel?opt.col:C.border}`,background:sel?opt.col+"22":"#f8fafc",color:sel?opt.col:C.muted,cursor:"pointer",fontFamily:"inherit",fontWeight:sel?700:600,transition:"all 0.12s"}}>{opt.label}</button>;
      })}
    </div>
  );
}

// -- SECTION SCORE -------------------------------------------
function SectionScore({ items, answers }) {
  const yesno = items.filter(i=>!i.type);
  const done  = yesno.filter(i=>answers[i.id]?.answer).length;
  const flag  = yesno.filter(i=>["no","lim","fi"].includes(answers[i.id]?.answer)).length;
  const pct   = yesno.length>0 ? Math.round(done/yesno.length*100) : 0;
  return (
    <div style={{display:"flex",gap:6,alignItems:"center"}}>
      {flag>0 && <span style={S.tag(C.red)}>{flag} flagged</span>}
      <span style={{fontSize:11,color:C.muted}}>{done}/{yesno.length} ({pct}%)</span>
    </div>
  );
}

// -- CHECKLIST SCREEN ----------------------------------------
function ChecklistScreen({ job, onBack, onNext }) {
  const [answers, setAnswers] = useState({});
  const [expanded, setExpanded] = useState("panels");
  const [stamp, setStamp] = useState(true);
  const [engName, setEngName] = useState(job?.engineer||"");

  const setAns  = (id,f,v) => setAnswers(a=>({...a,[id]:{...(a[id]||{}),[f]:v}}));
  const addPics = (id,pics) => setAnswers(a=>({...a,[id]:{...(a[id]||{}),photos:[...(a[id]?.photos||[]),...pics]}}));
  const remPic  = (id,pid)  => setAnswers(a=>({...a,[id]:{...(a[id]||{}),photos:(a[id]?.photos||[]).filter(p=>p.id!==pid)}}));

  const totalYN = SECTIONS.reduce((n,s)=>n+s.items.filter(i=>!i.type).length,0);
  const done    = Object.values(answers).filter(a=>a.answer).length;
  const pct     = Math.round(done/totalYN*100);
  const flagged = SECTIONS.reduce((n,s)=>n+s.items.filter(i=>["no","lim","fi"].includes(answers[i.id]?.answer)).length,0);

  return (
    <div style={{padding:16}}>
      {/* Stamp settings */}
      <div style={{...S.card,padding:12,marginBottom:14}}>
        <div style={{fontSize:11,color:C.accent,fontWeight:700,letterSpacing:"0.1em",marginBottom:10}}>📷 PHOTO STAMP SETTINGS</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:stamp?10:0}}>
          <span style={{fontSize:13}}>Geo-stamp &amp; date photos</span>
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
                  const flagged = ["no","lim","fi"].includes(ia.answer);
                  return (
                    <div key={item.id} style={{padding:"14px 16px",borderTop:idx>0?`1px solid ${C.border}10`:"none",background:flagged?C.red+"05":"transparent"}}>
                      <div style={{fontSize:14,color:C.text,marginBottom:10,lineHeight:1.55,fontWeight:500}}>{item.q}</div>
                      {!item.type && <AnswerRow value={ia.answer} onChange={v=>setAns(item.id,"answer",v)}/>}
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

// -- LOGIN ----------------------------------------------------
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
      const data = await sb.signIn(email, pass);
      if (data.error) {
        const msg = data.error.message || data.error.error_description || JSON.stringify(data.error);
        throw new Error(msg);
      }
      if (!data.access_token) {
        throw new Error("No token returned - email may need confirming first");
      }
      onLogin({
        email,
        name: data.user?.user_metadata?.full_name || email.split("@")[0],
        role: data.user?.user_metadata?.role || "engineer",
        token: data.access_token,
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

// -- DASHBOARD ------------------------------------------------
// -- DEMO DATA ------------------------------------------------
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

// -- CREATE JOB -----------------------------------------------
function CreateJobScreen({ onBack, onCreate }) {
  const generateJobNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth()+1).padStart(2,"0");
    const day = String(now.getDate()).padStart(2,"0");
    const rand = String(Math.floor(Math.random()*9000)+1000);
    return `TH-${year}${month}${day}-${rand}`;
  };
  const [form, setForm] = useState({client:"",address:"",jobNumber:generateJobNumber(),engineer:"",date:new Date().toISOString().split("T")[0],mode:"inspection"});
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  return (
    <div style={{padding:16}}>
      <div style={S.secTitle}>* New Job</div>
      {[["client","Client Name"],["address","Site Address"],["jobNumber","Job Number"],["engineer","Engineer"]].map(([k,l])=>(
        <div key={k} style={{marginBottom:12}}><label style={S.label}>{l}</label><input style={S.input} value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={l}/></div>
      ))}
      <div style={{marginBottom:12}}><label style={S.label}>Date</label><input style={S.input} type="date" value={form.date} onChange={e=>set("date",e.target.value)}/></div>
      <div style={{marginBottom:18}}>
        <label style={S.label}>Mode</label>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {["inspection","service","commissioning","diagnostic"].map(m=>(
            <button key={m} onClick={()=>set("mode",m)} style={{...S.btn(form.mode===m?"primary":"ghost"),marginBottom:0,padding:"11px 8px",fontSize:13}}>{m.charAt(0).toUpperCase()+m.slice(1)}</button>
          ))}
        </div>
      </div>
      <button style={S.btn("primary")} onClick={()=>onCreate({...form,id:Date.now(),status:"open",flagged:false})}>Create Job -></button>
      <button style={S.btn("ghost")} onClick={onBack}>Cancel</button>
    </div>
  );
}

// -- SPEC LOOKUP ENGINE --------------------------------------
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

// -- ASSET SCREEN ---------------------------------------------
function AssetScreen({ job, onBack, onNext }) {
  const [a, setA] = useState({
    panel_count:"", panel_make:"", panel_model:"",
    inverter_make:"", inverter_model:"", inverter_serial:"",
    system_age:"", meter_make:"", meter_serial:"", meter_reading:"",
    inverter_loc:"", dc_iso_loc:"", ac_iso_loc:""
  });
  const [inverterSpecs, setInverterSpecs] = useState(null);
  const [panelSpecs,    setPanelSpecs]    = useState(null);
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

// -- TEST RESULTS ---------------------------------------------
function TestResultsScreen({ onBack, onNext }) {
  const [r, setR] = useState({voc:"",isc:"",irradiance:"",ir_pos:"",ir_neg:"",polarity:null,zs:"",rcd_type:"Type A",rcd_trip:"",mcb_rating:"",breaking_cap:"",switchgear:null,inverter_ok:null,loss_mains:null});
  const set = (k,v) => setR(x=>({...x,[k]:v}));
  return (
    <div style={{padding:16}}>
      <div style={S.secTitle}>* Array Test Results</div>
      {[["voc","Voc (V)"],["isc","Isc (A)"],["irradiance","Irradiance (W/m2)"],["ir_pos","IR Pos-Earth (MOhm)"],["ir_neg","IR Neg-Earth (MOhm)"],["zs","Zs (Ohm)"],["rcd_trip","RCD Trip Time (ms)"],["mcb_rating","MCB Rating (A)"],["breaking_cap","Breaking Capacity (kA)"]].map(([k,l])=>(
        <div key={k} style={{marginBottom:12}}><label style={S.label}>{l}</label><input style={S.input} type="number" value={r[k]} onChange={e=>set(k,e.target.value)} placeholder="-"/></div>
      ))}
      <div style={{marginBottom:12}}>
        <label style={S.label}>RCD Type</label>
        <div style={{display:"flex",gap:6}}>
          {["Type A","Type B","Type F","Type AC"].map(v=><button key={v} onClick={()=>set("rcd_type",v)} style={{flex:1,background:r.rcd_type===v?C.blue+"22":"#f8fafc",color:r.rcd_type===v?C.blue:C.muted,border:`1px solid ${r.rcd_type===v?C.blue:C.border}`,borderRadius:7,padding:"9px 0",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{v}</button>)}
        </div>
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

// -- AI REVIEW SCREEN -----------------------------------------
function AIReviewScreen({ job, asset, checklist, testResults, onBack, onComplete }) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);

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

          <button style={S.btn("primary")} onClick={()=>onComplete(review)}>View Summary -></button>
        </>
      )}
      <button style={S.btn("ghost")} onClick={onBack}>← Back</button>
    </div>
  );
}

// -- SUMMARY --------------------------------------------------
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

// -- INLINE REPORT RENDERER ----------------------------------
function ReportScreen({ job, asset, checklist, testResults, review, type, onDone }) {
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
        <div style={{fontSize:11,color:C.muted,textAlign:"center",marginBottom:14}}>
          Swipe through {totalPages} pages . Screenshot each page to save
        </div>
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

// -- ROOT APP -------------------------------------------------
export default function App() {
  const [user,        setUser]        = useState(() => {
    // Restore session from localStorage on reload
    try {
      const saved = localStorage.getItem("themis_user");
      return saved ? JSON.parse(saved) : null;
    } catch(e) { return null; }
  });
  const [screen,      setScreen]      = useState("login");
  const [job,         setJob]         = useState(null);
  const [asset,       setAsset]       = useState(null);
  const [checklist,   setChecklist]   = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [review,      setReview]      = useState(null);
  const [reportType,     setReportType]     = useState(null);
  const [conditionality, setConditionality] = useState(null);
  const [saving,         setSaving]         = useState(false);

  const labels = {
    dashboard:"Dashboard", create_job:"New Job", asset:"Asset Details",
    checklist:"Checklist", test_results:"Test Results",
    ai_review:"AI Review", conditionality:"Conditionality", summary:"Summary", report:"Report"
  };

  // -- SAVE JOB TO SUPABASE ------------------------------------
  const saveJob = async (jobData) => {
    setSaving(true);
    try {
      const payload = {
        job_number:    jobData.jobNumber,
        client:        jobData.client,
        address:       jobData.address,
        mode:          jobData.mode,
        status:        "open",
        engineer_name: jobData.engineer,
        date:          jobData.date,
        flagged:       false,
      };
      const result = await sb.insert("jobs", user.token, payload);
      if (result && result[0]) {
        const saved = { ...jobData, id: result[0].id };
        console.log("Job saved - Supabase ID:", result[0].id);
        setJob(saved);
        setSaving(false);
        setScreen("asset");
        return saved;
      } else {
        console.error("Job insert returned no data:", JSON.stringify(result));
        // Navigate anyway with local ID
        setScreen("asset");
      }
    } catch(e) { console.error("Save job failed:", e); }
    setSaving(false);
  };

  // -- SAVE ASSET TO SUPABASE ----------------------------------
  const saveAsset = async (assetData, jobIdOverride) => {
    const jobId = jobIdOverride || job?.id;
    console.log("saveAsset - jobId:", jobId, "job:", job?.id, "override:", jobIdOverride);
    if (!jobId) { console.error("No job ID for asset save"); return; }
    setSaving(true);
    try {
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
      const assetResult = await sb.upsert("solar_assets", user.token, payload, "job_id");
      console.log("saveAsset result:", JSON.stringify(assetResult)?.slice(0,300));
      if (assetResult && assetResult.code) {
        console.error("Asset save error:", assetResult.message || assetResult.hint);
      }
      setAsset(assetData);
      setSaving(false);
      setScreen(job?.mode === "diagnostic" ? "ai_review" : "checklist");
    } catch(e) { console.error("Save asset failed:", e.message); setSaving(false); }
  };

  // -- SAVE CHECKLIST TO SUPABASE ------------------------------
  const saveChecklist = async (checklistData) => {
    const jobId = job?.id;
    console.log("saveChecklist - jobId:", jobId, "job:", JSON.stringify(job));
    if (!jobId) { console.error("No job ID for checklist save"); setScreen("test_results"); return; }
    setSaving(true);
    try {
      const rows = Object.entries(checklistData).map(([itemId, val]) => ({
        job_id:  jobId,
        item_id: itemId,
        answer:  val.answer || null,
        value:   val.value  || null,
        note:    val.note   || null,
        risk:    val.risk   || null,
      }));
      // Upsert in batches of 20
      for (let i = 0; i < rows.length; i += 20) {
        const clResult = await sb.upsert("checklist_answers", user.token,
          rows.slice(i, i+20), "job_id,item_id");
        console.log("saveChecklist batch", i, "result:", JSON.stringify(clResult)?.slice(0,200));
      }
      setChecklist(checklistData);
      setSaving(false);
      setScreen("test_results");
    } catch(e) { console.error("Save checklist failed:", e); setSaving(false); }
  };

  // -- SAVE TEST RESULTS TO SUPABASE --------------------------
  const saveTestResults = async (trData) => {
    const jobId = job?.id;
    console.log("saveTestResults - jobId:", jobId);
    if (!jobId) { console.error("No job ID for test results save"); setScreen("ai_review"); return; }
    setSaving(true);
    try {
      await sb.upsert("test_results", user.token, {
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
        switchgear:   trData.switchgear,
        inverter_ok:  trData.inverter_ok,
        loss_mains:   trData.loss_mains,
      }, "job_id");
      console.log("saveTestResults completed OK");
      setTestResults(trData);
      setSaving(false);
      setScreen("ai_review");
    } catch(e) { console.error("Save test results failed:", e); setSaving(false); }
  };

  // -- SAVE AI REVIEW TO SUPABASE ------------------------------
  const saveReview = async (reviewData) => {
    const jobId = job?.id;
    if (!jobId) { console.error("No job ID for review save"); setReview(reviewData); setScreen("summary"); return; }
    setSaving(true);
    try {
      await sb.upsert("ai_reviews", user.token, {
        job_id:              jobId,
        overall_status:      reviewData.overall_status,
        summary:             reviewData.summary,
        missing_information: reviewData.missing_information || [],
        risk_items:          reviewData.risk_items || [],
        recommended_actions: reviewData.recommended_actions || [],
        next_inspection:     reviewData.next_inspection,
        tags:                reviewData.tags || [],
      }, "job_id");
      // Update job status
      await sb.update("jobs", user.token,
        { status: "completed", flagged: (reviewData.risk_items||[]).some(r=>r.code==="C2") },
        "id=eq." + jobId
      );
      setReview(reviewData);
      setSaving(false);
      setScreen("conditionality");
    } catch(e) { console.error("Save review failed:", e); setSaving(false); }
  };

  // -- LOAD FULL JOB DATA FROM SUPABASE ----------------------
  const loadJobData = async (j) => {
    setJob(j);
    setAsset(null); setChecklist(null); setTestResults(null); setReview(null);
    setScreen("loading");

    try {
      const token = user.token;

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
          checklist[row.item_id] = {
            answer: row.answer || undefined,
            value:  row.value  || undefined,
            note:   row.note   || undefined,
            risk:   row.risk   || undefined,
            photos: [],
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
      } : null;

      setAsset(asset);
      setChecklist(Object.keys(checklist).length > 0 ? checklist : null);
      setTestResults(tr);
      setReview(review);

      // Navigate to appropriate screen
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
            setScreen("dashboard");
          }}/>
        )}
        {screen==="dashboard" && (
          <Dashboard
            user={user}
            onCreateJob={()=>setScreen("create_job")}
            onSelectJob={j=>{ loadJobData(j); }}
          />
        )}
        {screen==="create_job" && (
          <CreateJobScreen
            onBack={()=>setScreen("dashboard")}
            onCreate={saveJob}
          />
        )}
        {screen==="asset" && (
          <AssetScreen
            job={job}
            onBack={()=>setScreen("dashboard")}
            onNext={saveAsset}
          />
        )}
        {screen==="checklist" && (
          <ChecklistScreen
            job={job}
            onBack={()=>setScreen("asset")}
            onNext={saveChecklist}
          />
        )}
        {screen==="test_results" && (
          <TestResultsScreen
            onBack={()=>setScreen("checklist")}
            onNext={saveTestResults}
          />
        )}
        {screen==="ai_review" && (
          <AIReviewScreen
            job={job} asset={asset} checklist={checklist} testResults={testResults}
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
            onDone={()=>setScreen("dashboard")}
          />
        )}
        {!["login","loading","dashboard","create_job","asset","checklist","test_results","ai_review","conditionality","summary","report"].includes(screen) && (
          <div style={{padding:32,textAlign:"center"}}>
            <div style={{color:"#00e887",fontSize:14,marginBottom:16}}>Unknown screen: {screen}</div>
            <button style={{...S.btn("primary")}} onClick={()=>setScreen("dashboard")}>Go to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}
// -- CONDITIONALITY SCREEN ------------------------------------
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
