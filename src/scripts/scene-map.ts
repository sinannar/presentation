import {
  groupSceneMap, readSceneMapVisibility, sceneMapSection, searchSceneMap,
  writeSceneMapVisibility, type SceneMapEntry,
} from '../lib/scene-map';

export interface SceneMapOptions {
  scenes: HTMLElement[];
  getIndex: () => number;
  jump: (index: number, step?: number) => void;
}

let instance = 0;

/**
 * Import scene-map.css separately. Call open() from your own control/shortcut,
 * include isOpen() in the keynote's modal guard, and dispose() on teardown.
 * Reveal steps follow DOM order: the main scene button is step 0.
 */
export function installSceneMap({ scenes, getIndex, jump }: SceneMapOptions) {
  const prefix = `scene-map-${++instance}`;
  const events = new AbortController();
  let disposed = false;
  let returnFocus: HTMLElement | null = null;
  let entries: SceneMapEntry[] = [];
  let showHidden = false;
  let storage: Storage | undefined;
  try { storage = window.localStorage; } catch { /* Storage may be blocked. */ }
  const storageKey = `scene-map:visibility:${window.location.pathname}`;
  const visibility = readSceneMapVisibility(storage, storageKey);

  function element<K extends keyof HTMLElementTagNameMap>(
    tag: K, className: string, text?: string,
  ): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  const dialog = element('dialog', 'scene-map');
  dialog.setAttribute('aria-labelledby', `${prefix}-title`);
  dialog.setAttribute('aria-describedby', `${prefix}-hint`);
  const header = element('div', 'scene-map__header');
  const heading = element('div', 'scene-map__heading');
  heading.append(element('p', 'scene-map__eyebrow', 'Explore the story'));
  const title = element('h2', 'scene-map__title', 'Presentation map');
  title.id = `${prefix}-title`;
  heading.append(title);
  const closeButton = element('button', 'scene-map__close', 'Close');
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Close presentation map');
  header.append(heading, closeButton);
  const hint = element('p', 'scene-map__hint', 'Search, use the arrow keys to browse, and Enter to jump. Escape returns.');
  hint.id = `${prefix}-hint`;
  const label = element('label', 'scene-map__label', 'Search scenes');
  label.htmlFor = `${prefix}-search`;
  const search = element('input', 'scene-map__search');
  search.id = `${prefix}-search`;
  search.type = 'search';
  search.placeholder = 'Title, section, or idea…';
  search.autocomplete = 'off';
  search.setAttribute('autofocus', '');
  const status = element('p', 'scene-map__status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-atomic', 'true');
  const results = element('div', 'scene-map__results');
  results.id = `${prefix}-results`;
  search.setAttribute('aria-controls', results.id);
  const toolbar = element('div', 'scene-map__toolbar');
  const showHiddenButton = element('button', 'scene-map__visibility-toggle');
  showHiddenButton.type = 'button';
  const restoreAllButton = element('button', 'scene-map__restore-all', 'Restore all');
  restoreAllButton.type = 'button';
  toolbar.append(status, showHiddenButton, restoreAllButton);
  dialog.append(header, hint, label, search, toolbar, results);
  document.body.append(dialog);

  function restoreFocus() {
    const target = returnFocus;
    returnFocus = null;
    if (target?.isConnected) target.focus({ preventScroll: true });
  }

  function close() {
    if (!dialog.open) return;
    dialog.close();
    restoreFocus();
  }

  function navigate(index: number, step: number) {
    close();
    jump(index, step);
  }

  function render() {
    const matches = searchSceneMap(entries, search.value);
    const isHidden = (entry: SceneMapEntry) =>
      visibility.scenes.has(entry.id) || visibility.sections.has(sceneMapSection(entry));
    const visible = matches.filter((entry) => !isHidden(entry));
    const displayed = showHidden ? matches : visible;
    const hiddenCount = entries.filter(isHidden).length;
    results.replaceChildren();
    const currentEntry = entries.find((entry) => entry.index === getIndex());
    status.textContent = `${visible.length} of ${entries.length} scenes visible${hiddenCount ? ` · ${hiddenCount} hidden` : ''}${currentEntry && isHidden(currentEntry) ? ' · Current scene hidden from map' : ''}`;
    showHiddenButton.textContent = showHidden ? 'Hide hidden items' : `Show hidden items (${hiddenCount})`;
    showHiddenButton.setAttribute('aria-pressed', String(showHidden));
    restoreAllButton.hidden = !visibility.scenes.size && !visibility.sections.size;
    if (!displayed.length) {
      results.append(element('p', 'scene-map__empty', entries.length
        ? hiddenCount && !search.value.trim()
          ? 'All scenes are hidden from the map. Show hidden items or restore all.'
          : 'No visible scenes match. Try another search or show hidden items.'
        : 'There are no scenes to explore yet.'));
      return;
    }
    const current = getIndex();
    const quickEntries = visible.filter((entry) => ['home', 'sections', 'highlights'].includes(entry.kind));
    if (quickEntries.length) {
      const quick = element('section', 'scene-map__quick');
      const quickTitle = element('h3', 'scene-map__quick-title', 'Quick navigation');
      const cards = element('div', 'scene-map__quick-cards');
      quick.append(quickTitle, cards);
      for (const entry of quickEntries) {
        const card = element('button', 'scene-map__quick-card scene-map__destination');
        card.type = 'button';
        card.dataset.sceneId = entry.id;
        if (entry.index === current) card.setAttribute('aria-current', 'location');
        card.append(
          element('span', 'scene-map__quick-kind', entry.kind),
          element('span', 'scene-map__quick-name', entry.title),
          element('span', 'scene-map__quick-arrow', '↗'),
        );
        card.addEventListener('click', () => navigate(entry.index, 0));
        cards.append(card);
      }
      results.append(quick);
    }
    const grid = element('div', 'scene-map__grid');
    results.append(grid);
    for (const [groupIndex, group] of groupSceneMap(displayed).entries()) {
      const section = element('section', 'scene-map__section');
      const sectionHeader = element('div', 'scene-map__section-header');
      const groupTitle = element('h3', 'scene-map__section-title', group.section);
      groupTitle.id = `${prefix}-group-${groupIndex}`;
      section.setAttribute('aria-labelledby', groupTitle.id);
      const count = element('span', 'scene-map__section-count', String(group.entries.length));
      count.setAttribute('aria-label', `${group.entries.length} scenes`);
      groupTitle.append(count);
      const sectionHidden = visibility.sections.has(group.section);
      const sectionControl = element('button', 'scene-map__manage', sectionHidden ? 'Restore section' : 'Hide section');
      sectionControl.type = 'button';
      sectionControl.setAttribute('aria-label', `${sectionHidden ? 'Restore' : 'Hide'} section ${group.section}${sectionHidden ? ' in' : ' from'} map`);
      sectionControl.addEventListener('click', () => {
        if (sectionHidden) visibility.sections.delete(group.section);
        else visibility.sections.add(group.section);
        writeSceneMapVisibility(storage, storageKey, visibility);
        render();
        showHiddenButton.focus();
      });
      sectionHeader.append(groupTitle, sectionControl);
      const list = element('ol', 'scene-map__list');
      for (const entry of group.entries) {
        const item = element('li', 'scene-map__item');
        const hidden = isHidden(entry);
        const individuallyHidden = visibility.scenes.has(entry.id);
        if (hidden) item.classList.add('scene-map__item--hidden');
        const button = element('button', 'scene-map__destination');
        button.type = 'button';
        button.dataset.sceneId = entry.id;
        button.disabled = hidden;
        if (entry.index === current) {
          item.classList.add('scene-map__item--current');
          button.setAttribute('aria-current', 'location');
        }
        const number = element('span', 'scene-map__number', String(entry.index + 1).padStart(2, '0'));
        number.setAttribute('aria-hidden', 'true');
        const copy = element('span', 'scene-map__copy');
        const meta = element('span', 'scene-map__meta', [
          entry.kind, entry.featured ? 'Featured' : '', entry.index === current ? 'Current scene' : '',
          hidden ? (sectionHidden ? 'Hidden by section' : 'Hidden from map') : '',
        ].filter(Boolean).join(' · '));
        copy.append(meta, element('span', 'scene-map__scene-title', entry.title));
        if (entry.summary) copy.append(element('span', 'scene-map__summary', entry.summary));
        button.append(number, copy);
        button.addEventListener('click', () => navigate(entry.index, 0));
        item.append(button);
        const itemControl = element('button', 'scene-map__manage scene-map__item-manage', individuallyHidden ? 'Restore' : 'Hide');
        itemControl.type = 'button';
        itemControl.disabled = sectionHidden && !individuallyHidden;
        itemControl.setAttribute('aria-label', itemControl.disabled
          ? `${entry.title} is hidden by section; restore the section first`
          : `${individuallyHidden ? 'Restore' : 'Hide'} ${entry.title}${individuallyHidden ? ' in' : ' from'} map`);
        itemControl.addEventListener('click', () => {
          if (individuallyHidden) visibility.scenes.delete(entry.id);
          else visibility.scenes.add(entry.id);
          writeSceneMapVisibility(storage, storageKey, visibility);
          render();
          showHiddenButton.focus();
        });
        item.append(itemControl);
        if (entry.steps.length && !hidden) {
          const details = element('details', 'scene-map__steps');
          details.append(element('summary', '', `Reveal steps (${entry.steps.length})`));
          const steps = element('ol', 'scene-map__step-list');
          entry.steps.forEach((text, index) => {
            const step = element('li', '');
            const target = element('button', 'scene-map__step', `Step ${index + 1}: ${text}`);
            target.type = 'button';
            target.setAttribute('aria-label', `${entry.title} — Step ${index + 1}: ${text}`);
            target.addEventListener('click', () => navigate(entry.index, index + 1));
            step.append(target);
            steps.append(step);
          });
          details.append(steps);
          item.append(details);
        }
        list.append(item);
      }
      section.append(sectionHeader, list);
      grid.append(section);
    }
  }

  closeButton.addEventListener('click', close, { signal: events.signal });
  search.addEventListener('input', render, { signal: events.signal });
  showHiddenButton.addEventListener('click', () => {
    showHidden = !showHidden;
    render();
  }, { signal: events.signal });
  restoreAllButton.addEventListener('click', () => {
    visibility.scenes.clear();
    visibility.sections.clear();
    writeSceneMapVisibility(storage, storageKey, visibility);
    render();
    showHiddenButton.focus();
  }, { signal: events.signal });
  // Keep the presentation's global shortcuts out, without overriding native
  // text editing, Tab order, details toggling, or button activation.
  dialog.addEventListener('keydown', (event) => {
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.isComposing) return;
    const destinations = [...results.querySelectorAll<HTMLButtonElement>('.scene-map__destination, .scene-map__step')]
      .filter((button) => !button.disabled && !button.closest('details:not([open])'));
    if (event.target === search && event.key === 'Enter' && destinations[0]) {
      event.preventDefault();
      destinations[0].click();
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
      (event.target === search || destinations.includes(event.target as HTMLButtonElement)) && destinations.length) {
      event.preventDefault();
      const current = destinations.indexOf(event.target as HTMLButtonElement);
      const offset = event.key === 'ArrowDown' ? 1 : -1;
      const index = current < 0 ? (offset > 0 ? 0 : destinations.length - 1)
        : (current + offset + destinations.length) % destinations.length;
      destinations[index].focus();
    }
  }, { signal: events.signal });
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  }, { signal: events.signal });
  dialog.addEventListener('close', () => {
    if (!dialog.open) restoreFocus();
  }, { signal: events.signal });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right
      || event.clientY < rect.top || event.clientY > rect.bottom) close();
  }, { signal: events.signal });

  return {
    open() {
      if (disposed || dialog.open) return;
      returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      entries = scenes.map((scene, index) => ({
        id: scene.dataset.scene || `scene-${index + 1}`,
        index,
        title: scene.querySelector('h1, h2')?.textContent?.trim()
          || scene.getAttribute('aria-label')?.trim() || `Scene ${index + 1}`,
        kind: scene.dataset.kind?.trim() || 'content',
        section: scene.dataset.section?.trim() || 'Presentation',
        summary: scene.dataset.summary?.trim() || '',
        featured: scene.hasAttribute('data-featured')
          && !['false', '0'].includes(scene.dataset.featured?.trim().toLowerCase() || ''),
        steps: [...scene.querySelectorAll<HTMLElement>('[data-reveal]')].map((reveal, step) => {
          const text = reveal.getAttribute('aria-label')?.trim() || reveal.textContent?.trim();
          return text ? text.replace(/\s+/gu, ' ').slice(0, 100) : `Reveal ${step + 1}`;
        }),
      }));
      search.value = '';
      render();
      dialog.showModal();
      results.scrollTop = 0;
      search.focus({ preventScroll: true });
    },
    isOpen: () => dialog.open,
    dispose() {
      if (disposed) return;
      disposed = true;
      close();
      events.abort();
      dialog.remove();
    },
  };
}
