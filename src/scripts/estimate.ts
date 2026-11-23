// Live estimate: reads the form, shows a price range and timeline as the reader answers, and
// opens an email with the answers when the form is sent. The form is ordinary radio buttons,
// checkboxes, and a range input, so it can be filled in without this script; the script only
// adds the running total.

import { AI, DESIGN, INTEGRATIONS, PLATFORMS, TIMELINES, TYPES, canSend, estimate, money, SCREENS, type Answers, type Option } from '@/config/estimate';

function mount(): void {
  const form = document.querySelector<HTMLFormElement>('[data-estimate]');
  if (!form || form.dataset.ready !== undefined) return;
  form.dataset.ready = '';

  const range = form.querySelector<HTMLInputElement>('input[name="screens"]');
  const screensOut = form.querySelector<HTMLElement>('[data-screens-out]');
  const presets = Array.from(form.querySelectorAll<HTMLButtonElement>('[data-preset]'));
  const priceOut = form.querySelector<HTMLElement>('[data-price]');
  const weeksOut = form.querySelector<HTMLElement>('[data-weeks]');
  const send = form.querySelector<HTMLButtonElement>('[data-send]');
  const hint = form.querySelector<HTMLElement>('[data-send-hint]');
  const rows = new Map(Array.from(form.querySelectorAll<HTMLElement>('[data-sum]')).map((el) => [el.dataset.sum ?? '', el]));
  const bar = document.querySelector<HTMLElement>('[data-estimate-bar]');
  const barPrice = bar?.querySelector<HTMLElement>('[data-bar-price]');
  const mail = form.dataset.mail ?? '';

  const read = (): Answers => {
    const data = new FormData(form);
    const all = (name: string): string[] => data.getAll(name).map(String);
    return {
      type: (data.get('type') as string | null) ?? null,
      platforms: all('platforms'),
      screens: Number(data.get('screens') ?? SCREENS.start),
      design: (data.get('design') as string | null) ?? null,
      integrations: all('integrations'),
      ai: all('ai'),
      timeline: (data.get('timeline') as string | null) ?? 'standard',
    };
  };
  const labelOf = (list: readonly Option[], id: string | null): string | undefined => list.find((o) => o.id === id)?.label;
  const labels = (list: readonly Option[], ids: string[]): string => ids.map((id) => labelOf(list, id)).filter(Boolean).join(', ');

  const summary = (a: Answers): Array<[string, string]> => [
    ['project', labelOf(TYPES, a.type) ?? 'Not chosen'],
    ['platforms', labels(PLATFORMS, a.platforms) || 'Not chosen'],
    ['screens', a.screens >= SCREENS.max ? `${SCREENS.max}+` : String(a.screens)],
    ['design', labelOf(DESIGN, a.design) ?? 'Not chosen'],
    ['integrations', labels(INTEGRATIONS, a.integrations) || 'None'],
    ['ai', labels(AI, a.ai) || 'None'],
    ['timeline', labelOf(TIMELINES, a.timeline) ?? 'Standard'],
  ];

  const render = (): void => {
    const a = read();
    const e = estimate(a);
    const price = e ? `${money(e.low)} to ${money(e.high)}` : '';
    if (screensOut) screensOut.textContent = a.screens >= SCREENS.max ? `${SCREENS.max}+` : String(a.screens);
    for (const p of presets) p.setAttribute('aria-pressed', String(Number(p.dataset.preset) === a.screens));
    if (priceOut) {
      priceOut.textContent = e ? price : 'Start with question 1';
      priceOut.toggleAttribute('data-empty', !e);
    }
    if (weeksOut) weeksOut.textContent = e ? `About ${e.weeksLow} to ${e.weeksHigh} weeks` : '';
    for (const [key, value] of summary(a)) {
      const el = rows.get(key);
      if (el) el.textContent = value;
    }
    const ready = canSend(a);
    if (send) send.disabled = !ready;
    if (hint) hint.hidden = ready;
    if (barPrice) barPrice.textContent = e ? price : 'No estimate yet';
  };

  for (const p of presets) {
    p.addEventListener('click', () => {
      if (!range) return;
      range.value = p.dataset.preset ?? String(SCREENS.start);
      render();
    });
  }
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const a = read();
    const e = estimate(a);
    if (!e || !canSend(a) || !mail) return;
    const data = new FormData(form);
    const price = `${money(e.low)} to ${money(e.high)}`;
    const names: Record<string, string> = { project: 'Project', platforms: 'Platforms', screens: 'Screens', design: 'Design', integrations: 'Integrations', ai: 'AI', timeline: 'Timeline' };
    const lines = [
      `Name: ${String(data.get('name') ?? '')}`,
      `Email: ${String(data.get('email') ?? '')}`,
      data.get('company') ? `Company: ${String(data.get('company'))}` : null,
      '',
      ...summary(a).map(([key, value]) => `${names[key] ?? key}: ${value}`),
      `Estimate: ${price}, about ${e.weeksLow} to ${e.weeksHigh} weeks`,
      data.get('notes') ? `\n${String(data.get('notes'))}` : null,
    ].filter((line): line is string => line !== null);
    window.location.href = `mailto:${mail}?subject=${encodeURIComponent(`Project estimate: ${price}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
  });
  render();
}

document.addEventListener('astro:page-load', mount);
mount();
