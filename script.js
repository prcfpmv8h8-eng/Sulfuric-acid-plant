const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const searchMessage = document.getElementById("searchMessage");
const facilityButtons = document.querySelectorAll(".facility-card");
const resultsTitle = document.getElementById("resultsTitle");
const resultsCount = document.getElementById("resultsCount");
const resultsGrid = document.getElementById("resultsGrid");
const emptyState = document.getElementById("emptyState");
const focusSearch = document.getElementById("focusSearch");
const connectionStatus = document.getElementById("connectionStatus");
const addEquipmentBtn = document.getElementById("addEquipmentBtn");

const menuBtn = document.getElementById("menuBtn");
const closeMenu = document.getElementById("closeMenu");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

const equipmentModal = document.getElementById("equipmentModal");
const equipmentModalClose = document.getElementById("equipmentModalClose");
const editCurrentEquipmentBtn = document.getElementById("editCurrentEquipmentBtn");

const editorModal = document.getElementById("editorModal");
const editorModalClose = document.getElementById("editorModalClose");
const equipmentForm = document.getElementById("equipmentForm");
const editorTitle = document.getElementById("editorTitle");
const formMessage = document.getElementById("formMessage");
const saveEquipmentBtn = document.getElementById("saveEquipmentBtn");

const fields = {
  uid: document.getElementById("editUid"),
  equipmentId: document.getElementById("editEquipmentId"),
  name: document.getElementById("editName"),
  facility: document.getElementById("editFacility"),
  section: document.getElementById("editSection"),
  location: document.getElementById("editLocation"),
  description: document.getElementById("editDescription"),
  operation: document.getElementById("editOperation"),
  additionalInfo: document.getElementById("editAdditionalInfo"),
  imageFile: document.getElementById("editImageFile"),
  currentImageText: document.getElementById("currentImageText")
};

let equipment = [];
let activeFacility = null;
let currentEquipment = null;
let supabaseClient = null;
let liveMode = false;

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[־–—]/g, "-").replace(/\s+/g, " ").trim();
}

function textOrDash(value) {
  return String(value || "").trim() || "—";
}

function mapRow(row) {
  return {
    uid: row.uid,
    id: row.equipment_id,
    name: row.name,
    facility: row.facility,
    section: row.section || "",
    description: row.description || "",
    location: row.location || "",
    operation: row.operation || "",
    additionalInfo: row.additional_info || "",
    notes: row.notes || "",
    image: row.image_url || ""
  };
}

function searchableText(item) {
  return normalize([
    item.id, item.name, item.facility, item.section, item.description,
    item.location, item.operation, item.additionalInfo, item.notes
  ].join(" "));
}

function configuredForSupabase() {
  const config = window.APP_CONFIG || {};
  return config.SUPABASE_URL &&
    config.SUPABASE_ANON_KEY &&
    !config.SUPABASE_URL.includes("PASTE_") &&
    !config.SUPABASE_ANON_KEY.includes("PASTE_");
}

async function initializeData() {
  if (!configuredForSupabase()) {
    connectionStatus.textContent = "מצב הדגמה: יש להשלים את config.js כדי לאפשר שמירה בזמן אמת.";
    connectionStatus.classList.add("warning");
    addEquipmentBtn.disabled = true;
    editCurrentEquipmentBtn.disabled = true;
    const response = await fetch("equipment.json?v=5.0");
    equipment = await response.json();
    return;
  }

  supabaseClient = window.supabase.createClient(
    window.APP_CONFIG.SUPABASE_URL,
    window.APP_CONFIG.SUPABASE_ANON_KEY
  );

  liveMode = true;
  connectionStatus.textContent = "מחובר — שינויים נשמרים ומתעדכנים בזמן אמת.";
  connectionStatus.classList.add("connected");

  await loadFromSupabase();

  supabaseClient
    .channel("equipment-live-updates")
    .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "equipment"
    }, async () => {
      await loadFromSupabase();
      applyFilters();
    })
    .subscribe();
}

async function loadFromSupabase() {
  const { data, error } = await supabaseClient
    .from("equipment")
    .select("*")
    .order("facility")
    .order("equipment_id");

  if (error) throw error;
  equipment = data.map(mapRow);
}

function renderResults(items, title) {
  resultsTitle.textContent = title;
  resultsCount.textContent = `${items.length} תוצאות`;
  resultsGrid.innerHTML = "";

  if (!items.length) {
    emptyState.style.display = "flex";
    emptyState.querySelector("h3").textContent = "לא נמצאו תוצאות";
    emptyState.querySelector("p").textContent = "נסה מספר ציוד, שם אחר או בחר מתקן.";
    return;
  }

  emptyState.style.display = "none";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "equipment-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");

    card.innerHTML = `
      <div class="equipment-card-visual">
        <img class="equipment-thumb" src="${item.image || "images/placeholder.svg"}" alt="" onerror="this.src='images/placeholder.svg'">
      </div>
      <div class="equipment-card-body">
        <div class="equipment-card-head">
          <span class="equipment-tag" dir="ltr">${item.id}</span>
          <span class="facility-badge">מתקן ${item.facility}</span>
        </div>
        <h3>${item.name}</h3>
        <div class="equipment-section">${item.section || "ללא אזור"}</div>
        <p class="equipment-description">${item.description || "לא הוזן הסבר לציוד זה."}</p>
        <button class="open-equipment-btn" type="button">פתח פרטים מלאים <span>←</span></button>
      </div>
    `;

    const open = () => openEquipmentModal(item);
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
    card.querySelector("button").addEventListener("click", (event) => {
      event.stopPropagation();
      open();
    });
    resultsGrid.appendChild(card);
  });
}

function applyFilters() {
  const query = normalize(searchInput.value);
  clearSearch.style.display = query ? "flex" : "none";
  let filtered = equipment;

  if (activeFacility) filtered = filtered.filter(item => item.facility === activeFacility);
  if (query) filtered = filtered.filter(item => searchableText(item).includes(query));

  if (!query && !activeFacility) {
    resultsGrid.innerHTML = "";
    resultsCount.textContent = "0 תוצאות";
    resultsTitle.textContent = "תוצאות חיפוש";
    emptyState.style.display = "flex";
    searchMessage.textContent = "";
    return;
  }

  const title = query ? `תוצאות עבור "${searchInput.value.trim()}"` : `ציוד במתקן ${activeFacility}`;
  searchMessage.textContent = activeFacility ? `מסנן פעיל: מתקן ${activeFacility}` : "";
  renderResults(filtered, title);
}

function openEquipmentModal(item) {
  currentEquipment = item;
  document.getElementById("modalEquipmentId").textContent = item.id;
  document.getElementById("modalEquipmentName").textContent = item.name;
  document.getElementById("modalEquipmentFacility").textContent = `מתקן ${item.facility}`;
  document.getElementById("modalEquipmentSection").textContent = textOrDash(item.section);
  document.getElementById("modalEquipmentLocation").textContent = textOrDash(item.location);
  document.getElementById("modalEquipmentDescription").textContent = textOrDash(item.description);
  document.getElementById("modalEquipmentOperation").textContent = textOrDash(item.operation);
  document.getElementById("modalEquipmentNotes").textContent =
    textOrDash([item.additionalInfo, item.notes].filter(Boolean).join("\n\n"));

  const image = document.getElementById("modalEquipmentImage");
  image.src = item.image || "images/placeholder.svg";
  image.onerror = () => { image.src = "images/placeholder.svg"; };

  editCurrentEquipmentBtn.disabled = !liveMode;
  equipmentModal.classList.add("open");
  equipmentModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeViewModal() {
  equipmentModal.classList.remove("open");
  equipmentModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function openEditor(item = null) {
  if (!liveMode) return;
  equipmentForm.reset();
  formMessage.textContent = "";

  if (item) {
    editorTitle.textContent = "עריכת יחידת ציוד";
    fields.uid.value = item.uid || "";
    fields.equipmentId.value = item.id;
    fields.name.value = item.name;
    fields.facility.value = item.facility;
    fields.section.value = item.section;
    fields.location.value = item.location;
    fields.description.value = item.description;
    fields.operation.value = item.operation;
    fields.additionalInfo.value = [item.additionalInfo, item.notes].filter(Boolean).join("\n\n");
    fields.currentImageText.textContent = item.image ? "קיימת תמונה ליחידה. בחירת קובץ חדש תחליף אותה." : "לא קיימת תמונה ליחידה.";
  } else {
    editorTitle.textContent = "הוספת יחידת ציוד";
    fields.uid.value = "";
    fields.currentImageText.textContent = "אפשר להוסיף תמונה עכשיו או בשלב מאוחר יותר.";
  }

  editorModal.classList.add("open");
  editorModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeEditor() {
  editorModal.classList.remove("open");
  editorModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

async function uploadImage(file, equipmentId) {
  if (!file) return null;

  const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
  const safeId = equipmentId.replace(/[^a-zA-Z0-9_-]/g, "-");
  const path = `${Date.now()}-${safeId}.${extension}`;

  const { error } = await supabaseClient.storage
    .from("equipment-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabaseClient.storage
    .from("equipment-images")
    .getPublicUrl(path);

  return data.publicUrl;
}

equipmentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!liveMode) return;

  saveEquipmentBtn.disabled = true;
  saveEquipmentBtn.textContent = "שומר...";
  formMessage.textContent = "";

  try {
    const existing = equipment.find(item => item.uid === fields.uid.value);
    let imageUrl = existing?.image || "";

    if (fields.imageFile.files[0]) {
      imageUrl = await uploadImage(fields.imageFile.files[0], fields.equipmentId.value.trim());
    }

    const payload = {
      equipment_id: fields.equipmentId.value.trim(),
      name: fields.name.value.trim(),
      facility: fields.facility.value,
      section: fields.section.value.trim(),
      location: fields.location.value.trim(),
      description: fields.description.value.trim(),
      operation: fields.operation.value.trim(),
      additional_info: fields.additionalInfo.value.trim(),
      notes: "",
      image_url: imageUrl
    };

    let result;
    if (fields.uid.value) {
      result = await supabaseClient.from("equipment").update(payload).eq("uid", fields.uid.value);
    } else {
      result = await supabaseClient.from("equipment").insert(payload);
    }

    if (result.error) throw result.error;

    await loadFromSupabase();
    applyFilters();
    closeEditor();
    closeViewModal();
  } catch (error) {
    console.error(error);
    formMessage.textContent = `השמירה נכשלה: ${error.message || "שגיאה לא ידועה"}`;
  } finally {
    saveEquipmentBtn.disabled = false;
    saveEquipmentBtn.textContent = "שמירת השינויים";
  }
});

searchInput.addEventListener("input", applyFilters);
clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  activeFacility = null;
  applyFilters();
  searchInput.focus();
});

facilityButtons.forEach(button => {
  button.addEventListener("click", () => {
    activeFacility = button.dataset.facility;
    searchInput.value = "";
    applyFilters();
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });
  });
});

addEquipmentBtn.addEventListener("click", () => openEditor());
editCurrentEquipmentBtn.addEventListener("click", () => openEditor(currentEquipment));
equipmentModalClose.addEventListener("click", closeViewModal);
editorModalClose.addEventListener("click", closeEditor);
document.querySelector("[data-close-view]").addEventListener("click", closeViewModal);
document.querySelector("[data-close-editor]").addEventListener("click", closeEditor);

focusSearch.addEventListener("click", () => {
  document.getElementById("home").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => searchInput.focus(), 350);
});

function openMenu() {
  sideMenu.classList.add("open");
  menuOverlay.classList.add("show");
  document.body.classList.add("menu-open");
}
function closeSideMenu() {
  sideMenu.classList.remove("open");
  menuOverlay.classList.remove("show");
  document.body.classList.remove("menu-open");
}
menuBtn.addEventListener("click", openMenu);
closeMenu.addEventListener("click", closeSideMenu);
menuOverlay.addEventListener("click", closeSideMenu);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeSideMenu();
    closeViewModal();
    closeEditor();
  }
});

initializeData().catch(error => {
  console.error(error);
  connectionStatus.textContent = `שגיאת חיבור: ${error.message}`;
  connectionStatus.classList.add("error");
});
