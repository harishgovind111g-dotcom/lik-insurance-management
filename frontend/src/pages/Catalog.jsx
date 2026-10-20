import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useLoad } from '../lib/util.js';
import Icon, { metaFor } from '../components/Icon.jsx';
import PlanCard from '../components/PlanCard.jsx';
import { Empty, ErrorBox, Loader, PageHeader } from '../components/ui.jsx';

/** /insurance — every category with its plan count. */
export function Categories() {
  const { data, error, loading, reload } = useLoad(() => Promise.all([api.get('/categories'), api.get('/plans')]));
  const [categories = [], plans = []] = data || [];

  return (
    <>
      <PageHeader title="Insurance Categories" subtitle="Pick a category to compare the plans available." />
      <div className="container section-sm">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        <div className="category-grid">
          {categories.map((c) => {
            const meta = metaFor(c.id);
            const count = plans.filter((p) => p.cat === c.id && p.active).length;
            const from = Math.min(...plans.filter((p) => p.cat === c.id && p.active).map((p) => p.premium));
            return (
              <Link key={c.id} to={`/insurance/${c.id}`} className="category-card">
                <span className={`tile-icon lg tone-${meta.tone}`}><Icon name={meta.icon} size={28} /></span>
                <h3>{c.name}</h3>
                <p>{c.description}</p>
                <div className="category-foot">
                  <span>{count} plan{count === 1 ? '' : 's'}{Number.isFinite(from) ? ` · from ₹${from.toLocaleString('en-IN')}` : ''}</span>
                  <span className="link-arrow">Compare <Icon name="arrow" size={16} /></span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

/** /insurance/:slug — plans of one category with sorting. */
export function CategoryPlans() {
  const { slug } = useParams();
  const [sort, setSort] = useState('popular');
  const { data, error, loading, reload } = useLoad(
    () => Promise.all([api.get('/categories'), api.get(`/plans?category=${encodeURIComponent(slug)}`)]),
    [slug]
  );
  const [categories = [], allPlans = []] = data || [];
  const category = categories.find((c) => c.id === slug);
  const meta = metaFor(slug);

  const plans = useMemo(() => {
    const list = allPlans.filter((p) => p.active);
    if (sort === 'low') return [...list].sort((a, b) => a.premium - b.premium);
    if (sort === 'high') return [...list].sort((a, b) => b.cover - a.cover);
    return [...list].sort((a, b) => Number(b.popular) - Number(a.popular));
  }, [allPlans, sort]);

  return (
    <>
      <PageHeader
        back={{ to: '/insurance', label: 'All categories' }}
        title={category ? category.name : 'Insurance plans'}
        subtitle={category?.description}
        actions={<span className={`tile-icon xl tone-${meta.tone}`}><Icon name={meta.icon} size={34} /></span>}
      />
      <div className="container section-sm">
        {loading && <Loader />}
        <ErrorBox error={error} onRetry={reload} />
        {!loading && !error && !category && (
          <Empty title="Category not found" text="This insurance category does not exist." action={<Link className="btn btn-primary" to="/insurance">See all categories</Link>} />
        )}
        {category && (
          <>
            <div className="toolbar">
              <span><strong>{plans.length}</strong> plans found</span>
              <label className="select-inline">
                Sort by
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="popular">Popularity</option>
                  <option value="low">Premium: low to high</option>
                  <option value="high">Cover: high to low</option>
                </select>
              </label>
            </div>
            {plans.length === 0
              ? <Empty title="No plans right now" text="Plans in this category will be added soon." />
              : <div className="plan-grid">{plans.map((p) => <PlanCard key={p.id} plan={p} />)}</div>}
          </>
        )}
      </div>
    </>
  );
}
