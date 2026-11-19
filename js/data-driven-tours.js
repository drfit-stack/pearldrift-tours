(() => {
  "use strict";

  const grid = document.getElementById("tourDataGrid");
  if (!grid) return;

  const escapeClassName = value =>
    String(value || "").toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  }

  function renderTourCard(tour) {
    const card = makeElement("article", "tour-card");
    const slideshow = makeElement("div", "tour-image-slideshow");
    const images = Array.isArray(tour.images) ? tour.images : [];

    images.forEach((src, index) => {
      const image = makeElement("img", index === 0 ? "slide active" : "slide");
      image.src = src;
      image.alt = `${tour.title} — image ${index + 1}`;
      image.loading = "lazy";
      image.decoding = "async";
      image.addEventListener("click", () => {
        if (typeof window.openLightboxModal === "function") {
          window.openLightboxModal(images, index, image);
        }
      });
      slideshow.appendChild(image);
    });

    if (images.length > 1) {
      const previous = makeElement("button", "prev", "❮");
      previous.type = "button";
      previous.setAttribute("aria-label", `Previous ${tour.title} image`);
      previous.addEventListener("click", event => {
        event.stopPropagation();
        if (typeof window.changeSlide === "function") window.changeSlide(previous, -1);
      });

      const next = makeElement("button", "next", "❯");
      next.type = "button";
      next.setAttribute("aria-label", `Next ${tour.title} image`);
      next.addEventListener("click", event => {
        event.stopPropagation();
        if (typeof window.changeSlide === "function") window.changeSlide(next, 1);
      });

      slideshow.append(previous, next);
    }

    const content = makeElement("div", "tour-content");
    content.appendChild(makeElement("h3", "", tour.title || ""));
    const island = String(tour.details?.island || "").split(";")[0].trim();
    const atollValue = String(tour.details?.atoll || "").trim().replace(/[.,;:]+$/, "");
    const atoll = atollValue && !/\batoll$/i.test(atollValue)
      ? `${atollValue} Atoll`
      : atollValue;
    const location = [island, atoll].filter(Boolean).join(" · ");
    const metaParts = [];
    if (location) metaParts.push(location);
    if (tour.bestTimeToVisit) metaParts.push(`Best time: ${tour.bestTimeToVisit}`);
    if (metaParts.length) {
      const meta = makeElement("div", "tour-meta", metaParts.join(" · "));
      meta.setAttribute("aria-label", [
        location && `Location: ${location}`,
        tour.bestTimeToVisit && `Best time to visit: ${tour.bestTimeToVisit}`
      ].filter(Boolean).join(". "));
      content.appendChild(meta);
    }

    const badges = makeElement("div", "tour-badges");
    (Array.isArray(tour.badges) ? tour.badges.slice(0, 2) : []).forEach(label => {
      badges.appendChild(makeElement("span", "tour-badge", label));
    });
    if (badges.childElementCount) content.appendChild(badges);

    const footer = makeElement("div", "tour-card-footer");
    const priceBlock = makeElement("div", "tour-price-block");
    priceBlock.appendChild(makeElement("div", "tour-price", tour.price || ""));
    if (tour.priceNote) {
      const priceNote = makeElement("p", "tour-price-note");
      priceNote.append(
        makeElement("strong", "", "Rate basis: "),
        makeElement("span", "", tour.priceNote)
      );
      priceBlock.appendChild(priceNote);
    }
    footer.appendChild(priceBlock);

    const button = makeElement("button", "Contact-details-button", tour.buttonText || "More details →");
    button.type = "button";
    button.addEventListener("click", () => {
      if (typeof window.openDetailsModal === "function") {
        window.openDetailsModal(tour.id);
      }
    });
    footer.appendChild(button);
    content.appendChild(footer);

    card.append(slideshow, content);
    return card;
  }

  async function loadTours() {
    try {
      const response = await fetch(grid.dataset.source);
      if (!response.ok) throw new Error(`Tour data request failed (${response.status})`);

      const tours = await response.json();
      if (!Array.isArray(tours)) throw new Error("Tour data must be a JSON array");

      window.tourData = Object.fromEntries(
        tours.filter(tour => tour && tour.id).map(tour => [tour.id, tour])
      );

      const publishedTours = tours.filter(tour => tour && tour.published !== false);
      grid.dataset.cardCount = String(publishedTours.length);

      const fragment = document.createDocumentFragment();
      publishedTours.forEach(tour => {
        fragment.appendChild(renderTourCard(tour));
      });

      grid.replaceChildren(fragment);
    } catch (error) {
      console.error("Pearl Drift: could not load tour data.", error);
      grid.replaceChildren(
        makeElement("p", "tour-data-error", "Tours could not be loaded right now. Please try again later.")
      );
    }
  }

  loadTours();
})();
