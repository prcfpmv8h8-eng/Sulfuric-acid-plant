const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const searchMessage = document.getElementById("searchMessage");
const facilityButtons = document.querySelectorAll(".facility-card");
const resultsTitle = document.getElementById("resultsTitle");
const resultsCount = document.getElementById("resultsCount");

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
    document.querySelector(".results-section").scrollIntoView({ behavior: "smooth" });
  });
});
