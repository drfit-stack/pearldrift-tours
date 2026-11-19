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
    const location = tour.details?.location || [island, atoll].filter(Boolean).join(" · ");
    if (location) {
      content.appendChild(makeElement("div", "tour-meta", location));
    }

    if (tour.routeNote) {
      content.appendChild(makeElement("div", "tour-route-note", tour.routeNote));
    }

    const normalizedLocation = location.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    const highlights = (Array.isArray(tour.badges) ? tour.badges : [])
      .filter(label => {
        const normalizedLabel = String(label).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        return normalizedLabel && (!normalizedLocation || !normalizedLocation.includes(normalizedLabel));
      })
      .slice(0, 4);
    if (highlights.length) {
      const highlightList = makeElement("div", "tour-card-highlights");
      highlights.forEach(label => {
        highlightList.appendChild(makeElement("span", "tour-card-highlight", label));
      });
      content.appendChild(highlightList);
    }

    if (tour.duration) {
      const duration = makeElement("div", "tour-duration");
      const cardDuration = String(tour.duration).replace(/\s*\([^)]*\)/g, "").trim();
      duration.append(
        makeElement("span", "tour-duration-label", "Duration"),
        makeElement("strong", "", cardDuration)
      );
      content.appendChild(duration);
    }

    const footer = makeElement("div", "tour-card-footer");
    const priceBlock = makeElement("div", "tour-price-block");
    const hasStartingPrice = tour.price && tour.price.startsWith("From ");
    const priceLabel = hasStartingPrice
      ? "Starting at"
      : "Price";
    const cardPrice = hasStartingPrice ? tour.price.replace(/^From\s+/i, "") : tour.price;
    priceBlock.appendChild(makeElement("span", "tour-price-label", priceLabel));
    priceBlock.appendChild(makeElement("div", "tour-price", cardPrice || ""));
    footer.appendChild(priceBlock);

    const button = makeElement("button", "Contact-details-button", "View details →");
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
