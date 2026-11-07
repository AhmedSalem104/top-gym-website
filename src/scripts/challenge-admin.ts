import { challengeCopy, challengeError, type ChallengeLocale } from '../i18n/challenge';
import { challengeApi, ApiError } from './challenge-api';
import { adminPasswordForm } from './admin-password-form';
const node = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string, className?: string) => {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  if (className) n.className = className;
  return n;
};
interface Participant {
  id: string;
  name: string;
  email?: string;
  phone: string;
  createdAt: number;
  score: number;
  discount: number;
  coupon: string | null;
  status: string | null;
  redeemedAt: number | null;
  attribution: Record<string, string>;
}
interface Coupon {
  policy: {
    packages: ('gym' | 'gym-cardio')[];
    durations: ('half-month' | 'month' | 'two-months' | 'three-months' | 'six-months' | 'year')[];
    newCustomersOnly: boolean;
    combinable: boolean;
  };
  id: string;
  code: string;
  discount: number;
  state: string;
  expiresAt: number;
  participant: { name: string; email?: string };
  phone: string;
  terms: { ar: string; en: string };
  redemption: { redeemed_at: number; admin_id: string } | null;
}
export async function initAdmin() {
  const root = document.querySelector<HTMLElement>('[data-admin-root]')!,
    locale = root.dataset.locale as ChallengeLocale,
    c = challengeCopy[locale];
  const content = root.querySelector<HTMLElement>('[data-admin-content]')!,
    status = root.querySelector<HTMLElement>('[data-admin-status]')!;
  let csrf = '',
    role = '',
    page = 1,
    search = '',
    filter = 'all',
    sort = 'newest';
  const format = (date: number) =>
    new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Africa/Cairo',
    }).format(date);
  const button = (label: string, action: () => void, primary = false) => {
    const b = node('button', label, primary ? 'challenge-primary' : 'challenge-secondary');
    b.type = 'button';
    b.addEventListener('click', action);
    return b;
  };
  const field = (form: HTMLElement, label: string, type = 'text') => {
    const l = node('label', label, 'challenge-field'),
      i = node('input');
    i.type = type;
    l.append(i);
    form.append(l);
    return i;
  };
  const invoke = async <T>(path: string, body?: unknown, key?: string) =>
    challengeApi<T>('admin/' + path, body, {
      'X-CSRF-Token': csrf,
      ...(key ? { 'Idempotency-Key': key } : {}),
    });
  const task = async (fn: () => Promise<void>) => {
    status.textContent = c.loading;
    try {
      await fn();
      status.textContent = '';
    } catch (e) {
      status.textContent = e instanceof ApiError ? challengeError(e.code, locale) : c.connection;
      if (e instanceof ApiError && e.status === 401) login();
    }
  };
  function login() {
    content.replaceChildren();
    const { form } = adminPasswordForm(locale, async (session) => {
      csrf = session.csrf;
      role = session.role;
      await task(dashboard);
    });
    form.classList.add('challenge-admin-panel', 'challenge-admin-login');
    content.append(form);
  }
  async function dashboard() {
    content.replaceChildren();
    const bar = node('div', undefined, 'challenge-admin-pager');
    bar.append(
      button(c.refresh, () => void task(dashboard)),
      button(
        c.logout,
        () =>
          void task(async () => {
            await invoke('logout', {});
            csrf = '';
            login();
          }),
      ),
    );
    content.append(bar);
    const summary = await invoke<{
      participants: number;
      completed: number;
      issued: number;
      redeemed: number;
      unredeemed: number;
      expired: number;
      scores: { score: number; count: number }[];
      coupons: { discount: number; count: number }[];
      email: { state: string; count: number }[];
      conversions: { type: string; count: number }[];
    }>('summary');
    const kpis = node('div', undefined, 'challenge-admin-kpis');
    function renderMetrics(summary: Awaited<ReturnType<typeof getSummary>>) {
      kpis.replaceChildren();
      const metrics: [string, number][] = [
        [c.participants, summary.participants],
        [c.completed, summary.completed],
        [c.issued, summary.issued],
        [c.redeemed, summary.redeemed],
        [c.unredeemed, summary.unredeemed],
        [c.expired, summary.expired],
        [c.zero, summary.scores.find((x) => x.score === 0)?.count || 0],
        ...[10, 20, 30].map(
          (discount) =>
            [discount + '%', summary.coupons.find((x) => x.discount === discount)?.count || 0] as [
              string,
              number,
            ],
        ),
      ];
      for (const [label, value] of metrics) {
        const card = node('div', undefined, 'challenge-admin-kpi');
        card.append(node('span', label), node('strong', String(value)));
        kpis.append(card);
      }
    }
    const getSummary = () => invoke<typeof summary>('summary');
    renderMetrics(summary);
    content.append(kpis);
    const panel = node('section', undefined, 'challenge-admin-panel');
    panel.append(node('h2', c.participants));
    const toolbar = node('form', undefined, 'challenge-admin-toolbar');
    const searchInput = field(toolbar, c.search);
    searchInput.value = search;
    searchInput.maxLength = 100;
    const select = (label: string, items: [string, string][], value: string) => {
      const l = node('label', label, 'challenge-field'),
        s = node('select');
      items.forEach(([v, text]) => {
        const o = node('option', text);
        o.value = v;
        s.append(o);
      });
      s.value = value;
      l.append(s);
      toolbar.append(l);
      return s;
    };
    const statusSelect = select(
      c.status,
      [
        ['all', c.all],
        ['issued', c.statuses.issued],
        ['redeemed', c.statuses.redeemed],
        ['expired', c.statuses.expired],
        ['voided', c.statuses.voided],
        ['zero', c.zero],
      ],
      filter,
    );
    const sortSelect = select(
      c.date,
      [
        ['newest', c.newest],
        ['oldest', c.oldest],
        ['score', c.score],
      ],
      sort,
    );
    const go = node('button', c.searchButton, 'challenge-primary');
    go.type = 'submit';
    toolbar.append(go);
    panel.append(toolbar);
    const results = node('div');
    panel.append(results);
    content.append(panel);
    async function list() {
      const r = await invoke<{
        items: Participant[];
        total: number;
        page: number;
        pageSize: number;
      }>('participants/search', { page, search, status: filter, sort });
      results.replaceChildren();
      const wrapper = node('div', undefined, 'challenge-admin-table');
      wrapper.tabIndex = 0;
      wrapper.setAttribute('role', 'region');
      wrapper.setAttribute('aria-label', c.participants);
      const table = node('table'),
        head = node('thead'),
        tr = node('tr');
      [
        c.name,
        c.phoneColumn,
        c.emailColumn,
        c.date,
        c.score,
        c.discount,
        c.coupon,
        c.status,
        c.redeemed,
        c.details,
      ].forEach((x) => {
        const th = node('th', x);
        th.scope = 'col';
        tr.append(th);
      });
      head.append(tr);
      table.append(head);
      const body = node('tbody');
      for (const p of r.items) {
        const row = node('tr');
        const statusText = c.statuses[p.status as keyof typeof c.statuses] || c.noCoupon;
        for (const value of [
          p.name,
          p.phone,
          p.email || '—',
          format(p.createdAt),
          `${p.score}/3`,
          `${p.discount}%`,
          p.coupon || '—',
          statusText,
          p.redeemedAt ? format(p.redeemedAt) : '—',
        ]) {
          const td = node('td', value);
          td.dir = 'auto';
          row.append(td);
        }
        const td = node('td');
        td.append(button(c.details, () => void task(() => detail(p))));
        row.append(td);
        body.append(row);
      }
      table.append(body);
      wrapper.append(table);
      results.append(wrapper);
      if (!r.items.length) results.append(node('p', c.empty));
      const pager = node('div', undefined, 'challenge-admin-pager');
      const prev = button(c.previous, () => {
          page--;
          void task(list);
        }),
        next = button(c.next, () => {
          page++;
          void task(list);
        });
      prev.disabled = page <= 1;
      next.disabled = page * r.pageSize >= r.total;
      pager.append(prev, node('span', `${page} · ${r.total}`), next);
      results.append(pager);
    }
    toolbar.addEventListener('submit', (e) => {
      e.preventDefault();
      search = searchInput.value.trim();
      filter = statusSelect.value;
      sort = sortSelect.value;
      page = 1;
      void task(list);
    });
    await list();
    const detailPanel = node('section', undefined, 'challenge-admin-panel');
    detailPanel.hidden = true;
    content.append(detailPanel);
    async function detail(p: Participant) {
      const r = await invoke<{
        questions: {
          ordinal: number;
          question: { ar: string; en: string };
          options: { ar: string; en: string }[];
          answer: number | null;
          correctAnswer: number;
          timedOut: boolean;
          correct: boolean;
        }[];
      }>('participants/' + p.id);
      detailPanel.hidden = false;
      detailPanel.replaceChildren(node('h2', p.name), node('p', p.phone));
      for (const q of r.questions) {
        const card = node('article', undefined, 'challenge-admin-record');
        card.append(
          node('h3', `${q.ordinal}. ${q.question[locale]}`),
          node(
            'p',
            c.answer +
              ': ' +
              (q.timedOut ? c.timeout : q.answer === null ? '—' : q.options[q.answer][locale]),
          ),
          node('p', c.correctAnswer + ': ' + q.options[q.correctAnswer][locale]),
        );
        detailPanel.append(card);
      }
      detailPanel.append(
        node(
          'p',
          Object.entries(p.attribution)
            .map(([k, v]) => k + ': ' + v)
            .join(' · '),
        ),
      );
      detailPanel.tabIndex = -1;
      detailPanel.focus();
    }
    const redeemPanel = node('section', undefined, 'challenge-admin-panel');
    redeemPanel.append(node('h2', c.checkCoupon));
    const form = node('form');
    const couponCode = field(form, c.codeLabel);
    couponCode.required = true;
    couponCode.maxLength = 40;
    couponCode.dir = 'ltr';
    const lookup = node('button', c.lookup, 'challenge-primary');
    lookup.type = 'submit';
    form.append(lookup);
    redeemPanel.append(form);
    const couponDetails = node('div');
    redeemPanel.append(couponDetails);
    content.append(redeemPanel);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void task(async () => {
        const result = await invoke<Coupon>('coupons/lookup', { code: couponCode.value.trim() });
        showCoupon(result);
      });
    });
    function showCoupon(coupon: Coupon) {
      couponDetails.replaceChildren();
      const card = node('div', undefined, 'challenge-admin-record');
      card.append(
        node('h3', `${coupon.discount}% · ${coupon.participant.name}`),
        node('code', coupon.code),
        node('p', coupon.phone),
        node('p', c.statuses[coupon.state as keyof typeof c.statuses]),
        node('p', c.expires + ' ' + format(coupon.expiresAt)),
        node('p', coupon.terms[locale]),
      );
      if (coupon.redemption)
        card.append(node('p', c.redeemed + ' ' + format(coupon.redemption.redeemed_at)));
      if (coupon.state === 'issued' && role !== 'viewer') {
        const selection = (label: string, values: string[], labels: Record<string, string>) => {
          const wrap = node('label', label, 'challenge-field'),
            select = node('select');
          for (const value of values) {
            const option = node('option', labels[value]);
            option.value = value;
            select.append(option);
          }
          wrap.append(select);
          card.append(wrap);
          return select;
        };
        const pack = selection(c.package, coupon.policy.packages, c.packages),
          duration = selection(c.duration, coupon.policy.durations, c.durations);
        const flag = (label: string) => {
          const wrap = node('label', undefined, 'challenge-check'),
            input = node('input');
          input.type = 'checkbox';
          wrap.append(input, node('span', label));
          card.append(wrap);
          return input;
        };
        const newCustomer = flag(c.newCustomer),
          otherOffer = flag(c.otherOffer);
        const label = node('label', undefined, 'challenge-check'),
          check = node('input');
        check.type = 'checkbox';
        label.append(check, node('span', c.confirmRedeem));
        const key = crypto.randomUUID();
        const redeem = button(
          c.redeem,
          () => {
            if (!check.checked) return;
            redeem.disabled = true;
            void task(async () => {
              showCoupon(
                await invoke<Coupon>(
                  'coupons/redeem',
                  {
                    code: coupon.code,
                    confirm: true,
                    eligibility: {
                      package: pack.value,
                      duration: duration.value,
                      newCustomer: newCustomer.checked,
                      otherOffer: otherOffer.checked,
                    },
                  },
                  key,
                ),
              );
              renderMetrics(await getSummary());
              await list();
            }).finally(() => {
              redeem.disabled = !check.checked;
            });
          },
          true,
        );
        redeem.disabled = true;
        check.addEventListener('change', () => {
          redeem.disabled = !check.checked;
        });
        card.append(label, redeem);
      }
      couponDetails.append(card);
    }
    const operations = node('section', undefined, 'challenge-admin-panel');
    operations.append(node('h2', c.mailJobs));
    const operation = (key: string) => c.operations[key as keyof typeof c.operations] || key;
    for (const item of summary.email)
      operations.append(node('p', `${operation(item.state)}: ${item.count}`));
    operations.append(node('h2', c.events));
    for (const event of summary.conversions)
      operations.append(node('p', `${operation(event.type)}: ${event.count}`));
    content.append(operations);
    if (role === 'owner') {
      let before: number | undefined;
      const audit = node('section', undefined, 'challenge-admin-panel'),
        entries = node('div');
      audit.append(node('h2', c.audit), entries);
      const more = button(c.next, () => void task(loadAudit));
      audit.append(more);
      content.append(audit);
      async function loadAudit() {
        const r = await invoke<{
          items: {
            id: number;
            actor: string;
            action: string;
            reference: string;
            created_at: number;
          }[];
        }>('audit' + (before ? '?before=' + before : ''));
        for (const item of r.items) {
          const entry = node(
            'p',
            `${format(item.created_at)} · ${operation(item.action)} · ${item.reference}`,
            'challenge-admin-record',
          );
          entries.append(entry);
        }
        before = r.items.at(-1)?.id;
        more.disabled = r.items.length < 50;
      }
      await loadAudit();
    }
  }
  try {
    const session = await invoke<{ role: string; csrf: string }>('me');
    csrf = session.csrf;
    role = session.role;
    await task(dashboard);
  } catch {
    login();
  }
}
