const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const searchMessage = document.getElementById("searchMessage");
const facilityButtons = document.querySelectorAll(".facility-card");
const resultsTitle = document.getElementById("resultsTitle");
const resultsCount = document.getElementById("resultsCount");
const focusSearch = document.getElementById("focusSearch");

const menuBtn = document.getElementById("menuBtn");
const closeMenu = document.getElementById("closeMenu");
const sideMenu = document.getElementById("sideMenu");
const menuOverlay = document.getElementById("menuOverlay");

function updateSearchState() {
  const value = searchInput.value.trim();
  clearSearch.style.display = value ? "flex" : "none";

  if (!value) {
    searchMessage.textContent = "";
    resultsTitle.textContent = "תוצאות חיפוש";
    resultsCount.textContent = "0 תוצאות";
    return;
  }

  searchMessage.textContent = `מחפש: "${value}"`;
  resultsTitle.textContent = `תוצאות עבור "${value}"`;
  resultsCount.textContent = "0 תוצאות";
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

searchInput.addEventListener("input", updateSearchState);

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  updateSearchState();
  searchInput.focus();
});


facilityButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const facility = button.dataset.facility;
    resultsTitle.textContent = `ציוד במתקן ${facility}`;
    resultsCount.textContent = "0 תוצאות";
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

sideMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeSideMenu);
});


document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeSideMenu();
});
