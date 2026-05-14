import { Skeleton } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';

import { ReactComponent as TemplateIcon } from '@/assets/icons/template.svg';
import { TemplateHomePage } from '@/application/template.type';
import { TemplateService } from '@/application/services/domains';

function TemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [homepage, setHomepage] = useState<TemplateHomePage | null>(null);

  const loadHomepage = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await TemplateService.getHomepage();
      // Cloud returns flat JSON due to #[serde(flatten)]; normalize to nested { template, publish_info }.
      const normalize = (item: Record<string, unknown>) => {
        const { publish_info, ...templateFields } = item;
        return { template: templateFields, publish_info };
      };
      const data: TemplateHomePage = {
        featured_templates: raw.featured_templates.map(normalize),
        new_templates: raw.new_templates.map(normalize),
        template_groups: raw.template_groups.map((group) => ({
          ...group,
          templates: (group.templates as Record<string, unknown>[]).map(normalize),
        })),
      };
      setHomepage(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHomepage();
  }, [loadHomepage]);

  if (loading) {
    return (
      <div className={'flex h-screen w-screen items-center justify-center bg-bg-base'}>
        <div className={'flex flex-col gap-4'}>
          <Skeleton variant={'rectangular'} width={300} height={200} />
          <Skeleton variant={'rectangular'} width={300} height={200} />
        </div>
      </div>
    );
  }

  const hasTemplates = homepage && (
    homepage.featured_templates.length > 0 ||
    homepage.new_templates.length > 0 ||
    homepage.template_groups.some(g => g.templates.length > 0)
  );

  if (!hasTemplates) {
    return (
      <div className={'flex h-screen w-screen flex-col items-center justify-center gap-4 bg-bg-base'}>
        <TemplateIcon className={'h-16 w-16 text-text-placeholder'} />
        <h2 className={'text-2xl font-semibold text-text-title'}>
          No templates yet
        </h2>
        <p className={'text-text-caption'}>
          Publish a page and use it as a template to get started.
        </p>
      </div>
    );
  }

  return (
    <div className={'mx-auto flex h-screen w-full max-w-7xl flex-col gap-8 overflow-y-auto bg-bg-base p-8'}>
      {homepage.featured_templates.length > 0 && (
        <section>
          <h2 className={'mb-4 text-2xl font-semibold text-text-title'}>
            Featured
          </h2>
          <div className={'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
            {homepage.featured_templates.map((item) => (
              <TemplateCard key={item.template.view_id} item={item} />
            ))}
          </div>
        </section>
      )}

      {homepage.new_templates.length > 0 && (
        <section>
          <h2 className={'mb-4 text-2xl font-semibold text-text-title'}>
            New
          </h2>
          <div className={'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
            {homepage.new_templates.map((item) => (
              <TemplateCard key={item.template.view_id} item={item} />
            ))}
          </div>
        </section>
      )}

      {homepage.template_groups.map((group) => (
        group.templates.length > 0 && (
          <section key={group.category.id}>
            <h2 className={'mb-4 text-2xl font-semibold text-text-title'}>
              {group.category.name}
            </h2>
            <div className={'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
              {group.templates.map((item) => (
                <TemplateCard key={item.template.view_id} item={item} />
              ))}
            </div>
          </section>
        )
      ))}
    </div>
  );
}

function TemplateCard({ item }: { item: TemplateHomePage['featured_templates'][0] }) {
  const { template, publish_info } = item;
  const href = publish_info
    ? `/${publish_info.namespace}/${publish_info.publish_name}`
    : template.view_url;

  return (
    <a
      href={href}
      target={'_blank'}
      rel={'noreferrer'}
      className={
        'flex flex-col gap-2 rounded-lg border border-border-primary bg-bg-body p-4 transition-shadow hover:shadow-md'
      }
    >
      <h3 className={'text-lg font-medium text-text-title'}>{template.name}</h3>
      {template.description && (
        <p className={'line-clamp-2 text-sm text-text-caption'}>{template.description}</p>
      )}
      <div className={'mt-auto flex items-center gap-2 pt-2'}>
        {template.categories.slice(0, 2).map((cat) => (
          <span
            key={cat.id}
            className={'rounded-full bg-fill-list-hover px-2 py-0.5 text-xs text-text-caption'}
          >
            {cat.name}
          </span>
        ))}
        {template.creator && (
          <span className={'ml-auto text-xs text-text-caption'}>
            {template.creator.name}
          </span>
        )}
      </div>
    </a>
  );
}

export default TemplatesPage;