import { useEffect, useState } from 'react'
import { LegalDocType } from '@eguru/core'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Sparkles } from 'lucide-react'
import RichTextEditor from './RichTextEditor'
import {
  LEGAL_TABS,
  LEGAL_PROMPT_MAX_LENGTH,
  LEGAL_DISCLAIMER,
  legalStoreUrl,
} from './legalConstants'
import { useLegalDocs, useSaveLegalDoc, useGenerateLegalDoc } from '@/hooks/useLegalDocs'

interface LegalSectionProps {
  businessId: string
  businessOverride?: string
  readonly?: boolean
}

type ContentMap = Partial<Record<LegalDocType, string>>

export default function LegalSection({ businessId, businessOverride, readonly }: LegalSectionProps) {
  const { data } = useLegalDocs(businessId, businessOverride)
  const saveMutation = useSaveLegalDoc(businessId, businessOverride)
  const generateMutation = useGenerateLegalDoc(businessId, businessOverride)

  const [activeTab, setActiveTab] = useState<LegalDocType>(LEGAL_TABS[0].key)
  const [content, setContent] = useState<ContentMap>({})
  const [dirty, setDirty] = useState<Partial<Record<LegalDocType, boolean>>>({})

  const [showAiModal, setShowAiModal] = useState(false)
  const [description, setDescription] = useState('')

  const legalDocs = data?.legalDocs

  // Seed editor content from the server for any tab the user hasn't edited.
  useEffect(() => {
    if (!legalDocs) return
    setContent(prev => {
      const next = { ...prev }
      for (const tab of LEGAL_TABS) {
        if (!dirty[tab.key]) next[tab.key] = legalDocs[tab.key]?.content ?? ''
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legalDocs])

  const activeContent = content[activeTab] ?? ''
  const isDirty = !!dirty[activeTab]

  function handleEditorChange(html: string) {
    setContent(prev => ({ ...prev, [activeTab]: html }))
    setDirty(prev => ({ ...prev, [activeTab]: true }))
  }

  function handleSave() {
    saveMutation.mutate(
      { docType: activeTab, content: activeContent },
      { onSuccess: () => setDirty(prev => ({ ...prev, [activeTab]: false })) },
    )
  }

  function handleGenerate() {
    generateMutation.mutate(
      { docType: activeTab, description },
      {
        onSuccess: result => {
          setContent(prev => ({ ...prev, [activeTab]: result.document.content }))
          setDirty(prev => ({ ...prev, [activeTab]: false }))
          setShowAiModal(false)
          setDescription('')
        },
      },
    )
  }

  const activeTabMeta = LEGAL_TABS.find(t => t.key === activeTab)!
  const hasPublished = (key: LegalDocType) => !!legalDocs?.[key]?.content?.trim()
  const existingForActive = hasPublished(activeTab)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Documentos legales</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border" role="tablist">
        {LEGAL_TABS.map(tab => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5">
          <RichTextEditor
            key={activeTab}
            value={activeContent}
            onChange={handleEditorChange}
            onAiClick={() => setShowAiModal(true)}
            disabled={readonly || generateMutation.isPending}
            placeholder="Escribe aquí o presiona ✨ para generar con IA."
          />
        </CardContent>
      </Card>

      {!readonly && (
        <>
          <Separator />

          <p className="text-xs text-muted-foreground">⚠ {LEGAL_DISCLAIMER}</p>

          {saveMutation.isError && (
            <p className="text-xs text-destructive">{(saveMutation.error as Error).message}</p>
          )}

          <Button className="w-full" onClick={handleSave} disabled={!isDirty || saveMutation.isPending}>
            {saveMutation.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </>
      )}

      {/* Store links — only for documents already published */}
      {(hasPublished(LegalDocType.Terms) || hasPublished(LegalDocType.Privacy)) && (
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">Ver en tu tienda</p>
          {LEGAL_TABS.filter(tab => hasPublished(tab.key)).map(tab => (
            <a
              key={tab.key}
              href={legalStoreUrl(businessId, tab.storePath)}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-primary underline underline-offset-2"
            >
              → {tab.label}
            </a>
          ))}
        </div>
      )}

      {/* Generate-with-AI modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={() => setShowAiModal(false)}>
          <div className="fixed inset-0 bg-black/40" />
          <div
            className="relative w-full max-w-sm rounded-t-2xl bg-background p-6 shadow-xl sm:rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Sparkles size={18} className="text-primary" /> Generar con IA
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{activeTabMeta.label}</p>

            <Separator className="my-4" />

            <div className="space-y-1.5">
              <Label htmlFor="legal-ai-description">Describe tu negocio</Label>
              <textarea
                id="legal-ai-description"
                value={description}
                onChange={e => setDescription(e.target.value.slice(0, LEGAL_PROMPT_MAX_LENGTH))}
                rows={4}
                placeholder="Ej: Heladería en CDMX, vendemos por WhatsApp, aceptamos efectivo y transferencia bancaria…"
                className="w-full resize-none rounded-md border border-input bg-background px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-right text-xs text-muted-foreground">
                {description.length}/{LEGAL_PROMPT_MAX_LENGTH}
              </p>
            </div>

            {existingForActive && (
              <p className="mt-1 text-xs text-muted-foreground">
                Esto reemplazará el contenido actual de {activeTabMeta.label}.
              </p>
            )}

            {generateMutation.isError && (
              <p className="mt-2 text-xs text-destructive">{(generateMutation.error as Error).message}</p>
            )}

            <div className="mt-4 space-y-2">
              <Button
                className="w-full gap-2"
                onClick={handleGenerate}
                disabled={!description.trim() || generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Generando…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Generar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAiModal(false)}
                disabled={generateMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
