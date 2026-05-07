'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Onglet = 'manuel' | 'csv' | 'ia'

type Question = {
  id: string
  enonce: string
  choix_a: string
  choix_b: string
  choix_c: string
  choix_d: string
  bonne_rep: string
  ordre: number
}

type QuestionPreview = {
  enonce: string
  choix_a: string
  choix_b: string
  choix_c: string
  choix_d: string
  bonne_rep: string
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseCSVLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (values[i] ?? '').trim() })
    return obj
  })
}

const CHOIX = ['a', 'b', 'c', 'd'] as const

export default function QuestionsClient({
  concoursId,
  concoursTitre,
}: {
  concoursId: string
  concoursTitre: string
}) {
  const [onglet, setOnglet] = useState<Onglet>('manuel')
  const [questions, setQuestions] = useState<Question[]>([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState<string | null>(null)
  const [succes, setSucces] = useState<string | null>(null)

  // Onglet Manuel
  const [enonce, setEnonce] = useState('')
  const [choixA, setChoixA] = useState('')
  const [choixB, setChoixB] = useState('')
  const [choixC, setChoixC] = useState('')
  const [choixD, setChoixD] = useState('')
  const [bonneRep, setBonneRep] = useState('a')
  const [ajoutEnCours, setAjoutEnCours] = useState(false)

  // Onglet CSV
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([])
  const [importCSVEnCours, setImportCSVEnCours] = useState(false)

  // Onglet IA
  const [sujetIA, setSujetIA] = useState('')
  const [nombreIA, setNombreIA] = useState(5)
  const [questionsIA, setQuestionsIA] = useState<QuestionPreview[]>([])
  const [generationEnCours, setGenerationEnCours] = useState(false)
  const [importIAEnCours, setImportIAEnCours] = useState(false)

  const chargerQuestions = useCallback(async () => {
    setChargement(true)
    try {
      const res = await fetch(`/api/organisateur/questions/${concoursId}`)
      const data = await res.json()
      setQuestions(Array.isArray(data) ? data : [])
    } catch {
      setErreur('Impossible de charger les questions')
    } finally {
      setChargement(false)
    }
  }, [concoursId])

  useEffect(() => { chargerQuestions() }, [chargerQuestions])

  function showSucces(msg: string) {
    setSucces(msg)
    setErreur(null)
    setTimeout(() => setSucces(null), 4000)
  }

  async function handleAjouter(e: React.FormEvent) {
    e.preventDefault()
    setAjoutEnCours(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/organisateur/questions/${concoursId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enonce, choix_a: choixA, choix_b: choixB, choix_c: choixC, choix_d: choixD, bonne_rep: bonneRep }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erreur || 'Erreur serveur')
      setEnonce(''); setChoixA(''); setChoixB(''); setChoixC(''); setChoixD(''); setBonneRep('a')
      await chargerQuestions()
      showSucces('Question ajoutée.')
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setAjoutEnCours(false)
    }
  }

  async function handleSupprimer(questionId: string) {
    if (!confirm('Supprimer cette question définitivement ?')) return
    try {
      const res = await fetch(`/api/organisateur/questions/${concoursId}/${questionId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur lors de la suppression')
      await chargerQuestions()
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    }
  }

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const text = ev.target?.result as string
      setCsvRows(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
  }

  async function handleImporterCSV() {
    if (csvRows.length === 0) return
    setImportCSVEnCours(true)
    setErreur(null)
    try {
      const questions = csvRows.map(row => ({
        enonce: row.question || row.enonce,
        choix_a: row.choix_a,
        choix_b: row.choix_b,
        choix_c: row.choix_c,
        choix_d: row.choix_d,
        bonne_rep: row.bonne_rep,
      }))
      const res = await fetch(`/api/organisateur/questions/${concoursId}/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erreur || 'Erreur serveur')
      setCsvRows([])
      await chargerQuestions()
      showSucces(`${data.importees} question(s) importée(s) avec succès.`)
      setOnglet('manuel')
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setImportCSVEnCours(false)
    }
  }

  async function handleGenererIA(e: React.FormEvent) {
    e.preventDefault()
    setGenerationEnCours(true)
    setErreur(null)
    setQuestionsIA([])
    try {
      const res = await fetch(`/api/organisateur/questions/${concoursId}/generer-ia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sujet: sujetIA, nombre: nombreIA }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erreur || 'Erreur serveur')
      setQuestionsIA(data.questions)
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setGenerationEnCours(false)
    }
  }

  async function handleImporterIA() {
    if (questionsIA.length === 0) return
    setImportIAEnCours(true)
    setErreur(null)
    try {
      const res = await fetch(`/api/organisateur/questions/${concoursId}/import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: questionsIA }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.erreur || 'Erreur serveur')
      setQuestionsIA([])
      await chargerQuestions()
      showSucces(`${data.importees} question(s) générée(s) importée(s).`)
      setOnglet('manuel')
    } catch (err: unknown) {
      setErreur(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setImportIAEnCours(false)
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
      active
        ? 'border-ata-blue text-ata-blue'
        : 'border-transparent text-gray-400 hover:text-gray-600'
    }`

  const inputClass = 'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue'
  const labelClass = 'block text-sm font-semibold text-gray-700 mb-1.5'

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start gap-3 mb-8">
        <Link href="/organisateur" className="text-sm text-gray-400 hover:text-ata-blue transition-colors mt-1">
          ← Retour
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ata-blue">Questions</h1>
          <p className="text-sm text-gray-500 mt-0.5">{concoursTitre}</p>
        </div>
      </div>

      {erreur && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{erreur}</div>
      )}
      {succes && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{succes}</div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Onglets */}
        <div className="flex border-b border-gray-100">
          <button onClick={() => setOnglet('manuel')} className={tabClass(onglet === 'manuel')}>
            Saisie manuelle
          </button>
          <button onClick={() => setOnglet('csv')} className={tabClass(onglet === 'csv')}>
            Upload CSV
          </button>
          <button onClick={() => setOnglet('ia')} className={tabClass(onglet === 'ia')}>
            Générer avec IA
          </button>
        </div>

        <div className="p-6">
          {/* ── Onglet Saisie manuelle ── */}
          {onglet === 'manuel' && (
            <div className="space-y-8">
              <form onSubmit={handleAjouter} className="space-y-4">
                <h3 className="font-semibold text-gray-700">Ajouter une question</h3>
                <div>
                  <label className={labelClass}>Énoncé <span className="text-red-500">*</span></label>
                  <textarea
                    rows={3}
                    required
                    value={enonce}
                    onChange={e => setEnonce(e.target.value)}
                    placeholder="Saisissez la question..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: 'Choix A', val: choixA, set: setChoixA },
                    { label: 'Choix B', val: choixB, set: setChoixB },
                    { label: 'Choix C', val: choixC, set: setChoixC },
                    { label: 'Choix D', val: choixD, set: setChoixD },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className={labelClass}>{label} <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder={label}
                        className={inputClass}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex items-end gap-4 flex-wrap">
                  <div>
                    <label className={labelClass}>Bonne réponse <span className="text-red-500">*</span></label>
                    <select
                      value={bonneRep}
                      onChange={e => setBonneRep(e.target.value)}
                      className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue bg-white"
                    >
                      <option value="a">A</option>
                      <option value="b">B</option>
                      <option value="c">C</option>
                      <option value="d">D</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={ajoutEnCours}
                    className="bg-ata-green text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {ajoutEnCours ? 'Ajout...' : '+ Ajouter la question'}
                  </button>
                </div>
              </form>

              {/* Liste existante */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">
                  Questions du concours ({questions.length})
                </h3>
                {chargement ? (
                  <p className="text-sm text-gray-400">Chargement...</p>
                ) : questions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Aucune question pour l'instant.</p>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="bg-gray-50 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">
                            <span className="text-gray-400 mr-2 font-normal">{idx + 1}.</span>
                            {q.enonce}
                          </p>
                          <div className="flex flex-wrap gap-x-4 mt-1">
                            {CHOIX.map(l => (
                              <span
                                key={l}
                                className={`text-xs ${q.bonne_rep === l ? 'text-ata-green font-semibold' : 'text-gray-400'}`}
                              >
                                {l.toUpperCase()}. {q[`choix_${l}` as keyof Question]}{q.bonne_rep === l ? ' ✓' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          onClick={() => handleSupprimer(q.id)}
                          className="text-red-400 hover:text-red-600 transition-colors text-xs shrink-0 mt-0.5"
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Onglet Upload CSV ── */}
          {onglet === 'csv' && (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h3 className="font-semibold text-gray-700">Importer depuis un fichier CSV</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Colonnes requises :{' '}
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs text-gray-700">
                      question, choix_a, choix_b, choix_c, choix_d, bonne_rep
                    </code>
                  </p>
                </div>
                <a
                  href="/modele-questions.csv"
                  download
                  className="text-sm text-ata-blue underline hover:no-underline shrink-0"
                >
                  Télécharger le fichier modèle
                </a>
              </div>

              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-ata-orange transition-colors group">
                <span className="text-4xl mb-2">📄</span>
                <span className="text-sm text-gray-500 group-hover:text-ata-orange transition-colors">
                  Cliquer pour sélectionner un fichier .csv
                </span>
                <input type="file" accept=".csv,text/csv" onChange={handleCSVFile} className="sr-only" />
              </label>

              {csvRows.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    Aperçu — {csvRows.length} question(s) détectée(s)
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          {['#', 'Question', 'A', 'B', 'C', 'D', 'Rép.'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {csvRows.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                            <td className="px-3 py-2 text-gray-700 max-w-[200px] truncate">{row.question || row.enonce}</td>
                            <td className="px-3 py-2 text-gray-600 max-w-[80px] truncate">{row.choix_a}</td>
                            <td className="px-3 py-2 text-gray-600 max-w-[80px] truncate">{row.choix_b}</td>
                            <td className="px-3 py-2 text-gray-600 max-w-[80px] truncate">{row.choix_c}</td>
                            <td className="px-3 py-2 text-gray-600 max-w-[80px] truncate">{row.choix_d}</td>
                            <td className="px-3 py-2 font-bold text-ata-green uppercase">{row.bonne_rep}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvRows.length > 10 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        ... et {csvRows.length - 10} ligne(s) supplémentaire(s)
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleImporterCSV}
                      disabled={importCSVEnCours}
                      className="bg-ata-orange text-white font-semibold rounded-xl px-6 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {importCSVEnCours ? 'Importation...' : `Importer ${csvRows.length} question(s)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Onglet Générer avec IA ── */}
          {onglet === 'ia' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-gray-700">Générer des questions avec l'IA</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Décrivez le sujet et l'IA créera des questions QCM prêtes à importer.
                </p>
              </div>

              <form onSubmit={handleGenererIA} className="space-y-4">
                <div>
                  <label className={labelClass}>
                    Sujet / thème <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sujetIA}
                    onChange={e => setSujetIA(e.target.value)}
                    placeholder="ex : Histoire de la Côte d'Ivoire, Mathématiques CE2, Culture générale africaine..."
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end gap-4">
                  <div>
                    <label className={labelClass}>Nombre de questions</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={nombreIA}
                      onChange={e => setNombreIA(Number(e.target.value))}
                      className="w-24 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ata-blue"
                    />
                    <span className="text-xs text-gray-400 ml-2">max 20</span>
                  </div>
                  <button
                    type="submit"
                    disabled={generationEnCours}
                    className="bg-ata-blue text-white font-semibold rounded-xl px-6 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
                  >
                    {generationEnCours ? (
                      <>
                        <span className="inline-block animate-spin">⏳</span>
                        Génération...
                      </>
                    ) : '✨ Générer'}
                  </button>
                </div>
              </form>

              {questionsIA.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Questions générées ({questionsIA.length})
                  </h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {questionsIA.map((q, idx) => (
                      <div key={idx} className="bg-blue-50 rounded-xl px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 mb-1">
                          <span className="text-gray-400 font-normal mr-2">{idx + 1}.</span>
                          {q.enonce}
                        </p>
                        <div className="flex flex-wrap gap-x-4">
                          {CHOIX.map(l => (
                            <span
                              key={l}
                              className={`text-xs ${q.bonne_rep === l ? 'text-ata-green font-semibold' : 'text-gray-500'}`}
                            >
                              {l.toUpperCase()}. {q[`choix_${l}` as keyof QuestionPreview]}{q.bonne_rep === l ? ' ✓' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleImporterIA}
                      disabled={importIAEnCours}
                      className="bg-ata-green text-white font-semibold rounded-xl px-6 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                    >
                      {importIAEnCours ? 'Importation...' : `Importer ${questionsIA.length} question(s)`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
