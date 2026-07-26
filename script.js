const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const searchMessage = document.getElementById("searchMessage");
const facilityButtons = document.querySelectorAll(".facility-card");
const resultsTitle = document.getElementById("resultsTitle");
const resultsCount = document.getElementById("resultsCount");
const resultsGrid = document.getElementById("resultsGrid");
const emptyState = document.getElementById("emptyState");
const focusSearch = document.getElementById("focusSearch");

const menuBtn = document.getElementById("menuBtn");
const closeMenu = document.getElementById("closeMenu");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

const equipmentModal = document.getElementById("equipmentModal");
const equipmentModalOverlay = document.getElementById("equipmentModalOverlay");
const equipmentModalClose = document.getElementById("equipmentModalClose");

const modalEquipmentImage = document.getElementById("modalEquipmentImage");
const modalEquipmentId = document.getElementById("modalEquipmentId");
const modalEquipmentName = document.getElementById("modalEquipmentName");
const modalEquipmentFacility = document.getElementById("modalEquipmentFacility");
const modalEquipmentSection = document.getElementById("modalEquipmentSection");
const modalEquipmentLocation = document.getElementById("modalEquipmentLocation");
const modalEquipmentDescription = document.getElementById("modalEquipmentDescription");
const modalEquipmentOperation = document.getElementById("modalEquipmentOperation");
const modalEquipmentFaults = document.getElementById("modalEquipmentFaults");
const modalEquipmentSafety = document.getElementById("modalEquipmentSafety");
const modalEquipmentNotes = document.getElementById("modalEquipmentNotes");

let equipment = [];
let activeFacility = null;

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[־–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function searchableText(item) {
  return normalize([
    item.id,
    item.name,
    item.facility,
    item.section,
    item.description,
    item.notes,
    item.location,
    item.operation,
    item.commonFaults,
    item.safety,
    item.additionalInfo
  ].join(" "));
}

function textOrDash(value) {
  return String(value || "").trim() || "—";
}

function openEquipmentModal(item) {
  modalEquipmentId.textContent = item.id;
  modalEquipmentName.textContent = item.name;
  modalEquipmentFacility.textContent = `מתקן ${item.facility}`;
  modalEquipmentSection.textContent = textOrDash(item.section);
  modalEquipmentLocation.textContent = textOrDash(item.location);
  modalEquipmentDescription.textContent = textOrDash(item.description);
  modalEquipmentOperation.textContent = textOrDash(item.operation);
  modalEquipmentFaults.textContent = textOrDash(item.commonFaults);
  modalEquipmentSafety.textContent = textOrDash(item.safety);

  const combinedNotes = [item.additionalInfo, item.notes]
    .filter((value) => String(value || "").trim())
    .join("\n\n");

  modalEquipmentNotes.textContent = textOrDash(combinedNotes);

  modalEquipmentImage.src = item.image || "images/placeholder.svg";
  modalEquipmentImage.alt = item.image
    ? `תמונה של ${item.name}`
    : `לא הוזנה תמונה עבור ${item.name}`;

  modalEquipmentImage.onerror = () => {
    modalEquipmentImage.onerror = null;
    modalEquipmentImage.src = "images/placeholder.svg";
  };

  equipmentModal.classList.add("open");
  equipmentModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeEquipmentModal() {
  equipmentModal.classList.remove("open");
  equipmentModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
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
    card.setAttribute("aria-label", `פתיחת פרטי ${item.name}, ${item.id}`);

    const description = item.description
      ? `<p class="equipment-description">${item.description}</p>`
      : `<p class="equipment-description muted-description">לא הוזן הסבר לציוד זה.</p>`;

    const image = item.image
      ? `<img class="equipment-thumb" src="${item.image}" alt="" onerror="this.src='images/placeholder.svg'">`
      : `<img class="equipment-thumb" src="images/placeholder.svg" alt="">`;

    card.innerHTML = `
      <div class="equipment-card-visual">
        ${image}
      </div>

      <div class="equipment-card-body">
        <div class="equipment-card-head">
          <span class="equipment-tag" dir="ltr">${item.id}</span>
          <span class="facility-badge">מתקן ${item.facility}</span>
        </div>

        <h3>${item.name}</h3>
        <div class="equipment-section">${item.section}</div>
        ${description}

        <button class="open-equipment-btn" type="button">
          פתח פרטים מלאים
          <span aria-hidden="true">←</span>
        </button>
      </div>
    `;

    card.addEventListener("click", () => openEquipmentModal(item));
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openEquipmentModal(item);
      }
    });

    card.querySelector(".open-equipment-btn").addEventListener("click", (event) => {
      event.stopPropagation();
      openEquipmentModal(item);
    });

    resultsGrid.appendChild(card);
  });
}

function applyFilters() {
  const query = normalize(searchInput.value);
  clearSearch.style.display = query ? "flex" : "none";

  let filtered = equipment;

  if (activeFacility) {
    filtered = filtered.filter((item) => item.facility === activeFacility);
  }

  if (query) {
    filtered = filtered.filter((item) => searchableText(item).includes(query));
  }

  if (!query && !activeFacility) {
    resultsGrid.innerHTML = "";
    resultsCount.textContent = "0 תוצאות";
    resultsTitle.textContent = "תוצאות חיפוש";
    emptyState.style.display = "flex";
    emptyState.querySelector("h3").textContent = "התחל לחפש ציוד";
    emptyState.querySelector("p").textContent = "הקלד מספר ציוד או שם, או בחר מתקן להצגת כל הציוד שהוזן.";
    searchMessage.textContent = "";
    return;
  }

  const title = query
    ? `תוצאות עבור "${searchInput.value.trim()}"`
    : `ציוד במתקן ${activeFacility}`;

  searchMessage.textContent = activeFacility
    ? `מסנן פעיל: מתקן ${activeFacility}`
    : "";

  renderResults(filtered, title);
}

async function loadEquipment() {
  try {
    const response = await fetch("equipment.json?v=4.0");
    if (!response.ok) throw new Error("Failed to load equipment data");
    equipment = await response.json();
  } catch (error) {
    console.error(error);
    emptyState.querySelector("h3").textContent = "שגיאה בטעינת הנתונים";
    emptyState.querySelector("p").textContent = "ודא שהקובץ equipment.json הועלה ל-GitHub.";
  }
}

function openMenu() {
  sideMenu.classList.add("open");
  menuOverlay.classList.add("show");
  sideMenu.setAttribute("aria-hidden", "false");
  menuBtn.setAttribute("aria-expanded", "true");
  document.body.classList.add("menu-open");
}

function closeSideMenu() {
  sideMenu.classList.remove("open");
  menuOverlay.classList.remove("show");
  sideMenu.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

searchInput.addEventListener("input", applyFilters);

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  activeFacility = null;
  applyFilters();
  searchInput.focus();
});

facilityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFacility = button.dataset.facility;
    searchInput.value = "";
    applyFilters();
    document.getElementById("results").scrollIntoView({ behavior: "smooth" });
  });
});

focusSearch.addEventListener("click", () => {
  document.getElementById("home").scrollIntoView({ behavior: "smooth" });
  setTimeout(() => searchInput.focus(), 350);
});

menuBtn.addEventListener("click", openMenu);
closeMenu.addEventListener("click", closeSideMenu);
menuOverlay.addEventListener("click", closeSideMenu);

equipmentModalClose.addEventListener("click", closeEquipmentModal);
equipmentModalOverlay.addEventListener("click", closeEquipmentModal);

sideMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeSideMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeSideMenu();
    closeEquipmentModal();
  }
});

loadEquipment();
