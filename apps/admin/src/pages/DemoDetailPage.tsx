import { useNavigate } from 'react-router-dom'
import { useBusinessAction } from '../hooks/useBusinesses'
import ProductEditor from '../components/demos/ProductEditor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BusinessStatus, type Business } from '@eguru/core'

const STOREFRONT_URL = import.meta.env.VITE_STOREFRONT_URL ?? 'http://localhost:3010'

const PIPELINE_STEPS: { status: BusinessStatus; label: string }[] = [
  { status: BusinessStatus.Draft,    label: 'Draft' },
  { status: BusinessStatus.Demo,     label: 'Demo' },
  { status: BusinessStatus.Sent,     label: 'Sent' },
  { status: BusinessStatus.Accepted, label: 'Accepted' },
  { status: BusinessStatus.Active,   label: 'Active' },
]

const NEXT_ACTION: Partial<Record<BusinessStatus, { label: string; verb: string }>> = {
  [BusinessStatus.Draft]:    { label: 'Publish demo',  verb: 'publish' },
  [BusinessStatus.Demo]:     { label: 'Mark as sent',  verb: 'send' },
  [BusinessStatus.Sent]:     { label: 'Mark accepted', verb: 'accept' },
  [BusinessStatus.Accepted]: { label: 'Activate',      verb: 'activate' },
  [BusinessStatus.Active]:   { label: 'Suspend',       verb: 'suspend' },
}

function PipelineStepper({ status }: { status: BusinessStatus }) {
  const currentIdx = PIPELINE_STEPS.findIndex(s => s.status === status)

  return (
    <div className="flex items-start">
      {PIPELINE_STEPS.map(({ status: s, label }, idx) => {
        const isCompleted = idx < currentIdx
        const isCurrent   = idx === currentIdx

        return (
          <div key={s} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                isCurrent   ? 'bg-foreground border-foreground text-background' :
                isCompleted ? 'bg-foreground/10 border-foreground/30 text-foreground' :
                              'bg-background border-border text-muted-foreground'
              }`}>
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span className={`text-xs whitespace-nowrap ${isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </div>
            {idx < PIPELINE_STEPS.length - 1 && (
              <div className={`h-0.5 w-10 mt-3.5 mx-1 ${idx < currentIdx ? 'bg-foreground/30' : 'bg-border'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function DemoDetailPage({ business, onBack }: { business: Business; onBack: () => void }) {
  const action = useBusinessAction()
  const navigate = useNavigate()
  const next = NEXT_ACTION[business.status]

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 mb-5 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ backgroundColor: (business.theme?.primary ?? '#6366f1') + '20' }}
          >
            {business.theme?.emoji ?? '🏪'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{business.name}</h1>
            <p className="text-sm text-muted-foreground">{business.city} · {business.type}</p>
          </div>
        </div>
      </div>

      <PipelineStepper status={business.status} />

      {business.tagline && (
        <p className="text-muted-foreground">{business.tagline}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductEditor businessId={business.id} businessSlug={business.slug} />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <a href={`${STOREFRONT_URL}/demo/${business.slug}`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">View demo ↗</Button>
        </a>
        <Button
          variant="outline"
          onClick={() => navigate(`/owner/preview/${business.slug}`)}
        >
          Preview panel
        </Button>
        {next && (
          <Button
            disabled={action.isPending}
            onClick={() => action.mutate({ id: business.id, action: next.verb })}
          >
            {next.label} →
          </Button>
        )}
      </div>
    </div>
  )
}
