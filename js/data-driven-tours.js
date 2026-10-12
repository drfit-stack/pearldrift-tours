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

  function renderTourDescription(description) {
    const pager = makeElement("div", "tour-description-pager");
    pager.description = description;

    const paragraph = makeElement("p", "tour-description-page");
    paragraph.textContent = description;

    const controls = makeElement("div", "tour-description-controls");
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Description pages");
    const previous = makeElement("button", "", "‹");
    previous.type = "button";
    previous.setAttribute("aria-label", "Previous description page");
    previous.addEventListener("click", () => showDescriptionPage(pager, pager.pageIndex - 1));

    const counter = makeElement("span", "tour-description-counter");
    counter.setAttribute("aria-live", "polite");

    const next = makeElement("button", "", "›");
    next.type = "button";
    next.setAttribute("aria-label", "Next description page");
    next.addEventListener("click", () => showDescriptionPage(pager, pager.pageIndex + 1));

    controls.append(previous, counter, next);
    pager.append(paragraph, controls);
    pager.paragraph = paragraph;
    pager.controls = controls;
    pager.previousButton = previous;
    pager.counter = counter;
    pager.nextButton = next;
    pager.pages = [description];
    pager.pageIndex = 0;

    return pager;
  }

  function showDescriptionPage(pager, pageIndex) {
    pager.pageIndex = Math.max(0, Math.min(pageIndex, pager.pages.length - 1));
    const hasPages = pager.pages.length > 1;
    pager.classList.toggle("has-pages", hasPages);
    pager.controls.hidden = !hasPages;
    pager.paragraph.textContent = pager.pages[pager.pageIndex];
    pager.counter.textContent = `${pager.pageIndex + 1} / ${pager.pages.length}`;
    pager.previousButton.disabled = pager.pageIndex === 0;
    pager.nextButton.disabled = pager.pageIndex === pager.pages.length - 1;
  }

  function paginateTourDescription(pager) {
    const paragraph = pager.paragraph;
    const width = paragraph.clientWidth;
    if (!width) return;

    const maxHeight = Number.parseFloat(getComputedStyle(paragraph).maxHeight);
    if (!Number.isFinite(maxHeight)) return;
    pager.style.setProperty("--description-page-height", `${maxHeight}px`);
    pager.controls.hidden = false;

    const probe = paragraph.cloneNode(false);
    Object.assign(probe.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: `${width}px`,
      height: "auto",
      maxHeight: "none",
      overflow: "visible",
      flex: "none",
      margin: "0",
      visibility: "hidden"
    });
    pager.appendChild(probe);

    const words = pager.description.trim().split(/\s+/).filter(Boolean);
    const pages = [];
    let currentPage = "";

    words.forEach(word => {
      const candidate = currentPage ? `${currentPage} ${word}` : word;
      probe.textContent = candidate;
      if (currentPage && probe.scrollHeight > maxHeight + 1) {
        pages.push(currentPage);
        currentPage = word;
      } else {
        currentPage = candidate;
      }
    });

    if (currentPage) pages.push(currentPage);
    probe.remove();

    pager.pages = pages.length ? pages : [""];
    showDescriptionPage(pager, Math.min(pager.pageIndex, pager.pages.length - 1));
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
    if (tour.bestTimeToVisit) {
      const bestTime = makeElement("div", "tour-best-time");
      bestTime.append(
        makeElement("span", "tour-best-time-label", "Best time to visit: "),
        makeElement("span", "tour-best-time-value", tour.bestTimeToVisit)
      );
      content.appendChild(bestTime);
    }
    const badges = makeElement("div", "tour-badges");
    (Array.isArray(tour.badges) ? tour.badges : []).forEach(label => {
      badges.appendChild(makeElement("span", "tour-badge", label));
    });
    if (badges.childElementCount) content.appendChild(badges);

    const descriptionPager = renderTourDescription(tour.description || "");
    content.appendChild(descriptionPager);

    const footer = makeElement("div", "tour-card-footer");
    footer.appendChild(makeElement("div", "tour-price", tour.price || ""));

    const button = makeElement("button", "Contact-details-button", tour.buttonText || "View details →");
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

      const fragment = document.createDocumentFragment();
      tours.filter(tour => tour && tour.published !== false).forEach(tour => {
        fragment.appendChild(renderTourCard(tour));
      });

      grid.replaceChildren(fragment);

      grid.querySelectorAll(".tour-description-pager").forEach(paginateTourDescription);
    } catch (error) {
      console.error("Pearl Drift: could not load tour data.", error);
      grid.replaceChildren(
        makeElement("p", "tour-data-error", "Tours could not be loaded right now. Please try again later.")
      );
    }
  }

  let resizeFrame = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      grid.querySelectorAll(".tour-description-pager").forEach(paginateTourDescription);
    });
  });

  loadTours();
})();
