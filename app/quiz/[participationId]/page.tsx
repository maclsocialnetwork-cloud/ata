'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useRef } from 'react';

interface Question {
  id: string;
  enonce: string;
  choix: string[];
}

export default function QuizPage() {
  const { participationId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [index, setIndex] = useState(0);
  const [selectedRep, setSelectedRep] = useState<string | null>(null);
  const [total, setTotal] = useState(100);
  const [error, setError] = useState<string | null>(null);
  const [tempsRestant, setTempsRestant] = useState<number | null>(null);
  const mounted = useRef(true);

  // Charger une question
  const fetchQuestion = useCallback(async (idx: number) => {
    if (!participationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quiz/get-question?participationId=${participationId}&index=${idx}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur de chargement');
      }
      const data = await res.json();
      if (!mounted.current) return;
      setQuestion(data.question);
      setIndex(data.indexCourant);
      setTotal(data.total);
      if (data.tempsRestant) setTempsRestant(data.tempsRestant);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [participationId]);

  // Envoyer une réponse
  const handleRepondre = useCallback(async () => {
    if (!selectedRep || !question || !participationId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/quiz/repondre', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participationId,
          questionId: question.id,
          reponse: selectedRep
        })
      });
      if (!res.ok) throw new Error('Erreur enregistrement réponse');
      // Passer à la question suivante
      if (index + 1 >= total) {
        // Fin du quiz
        await fetch('/api/quiz/soumettre', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ participationId })
        });
        router.push(`/resultat/${participationId}`);
      } else {
        setSelectedRep(null);
        await fetchQuestion(index + 1);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedRep, question, participationId, index, total, router, fetchQuestion]);

  // Chargement initial
  useEffect(() => {
    mounted.current = true;
    fetchQuestion(0);
    return () => { mounted.current = false; };
  }, [fetchQuestion]);

  if (error) return <div className="text-red-600 text-center mt-10">{error}</div>;
  if (loading) return <div className="text-center mt-10">Chargement du quiz...</div>;
  if (!question) return <div className="text-center mt-10">Aucune question trouvée.</div>;

  return (
    <div className="min-h-screen bg-ata-blue p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm font-semibold bg-gray-200 px-3 py-1 rounded-full">
            Question {index+1} sur {total}
          </div>
          {tempsRestant !== null && (
            <div className="text-lg font-mono font-bold">Temps restant: {Math.floor(tempsRestant/60)}:{('0' + tempsRestant%60).slice(-2)}</div>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div className="bg-ata-orange h-2 rounded-full" style={{ width: `${((index+1)/total)*100}%` }}></div>
        </div>
        <h2 className="text-2xl font-bold text-ata-blue mb-6">{question.enonce}</h2>
        <div className="space-y-3">
          {question.choix.map((choix, i) => (
            <button
              key={i}
              onClick={() => setSelectedRep(String.fromCharCode(97+i))}
              className={`w-full text-left p-3 rounded-lg border transition ${
                selectedRep === String.fromCharCode(97+i)
                  ? 'bg-ata-orange text-white border-ata-orange'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {String.fromCharCode(97+i).toUpperCase()}. {choix}
            </button>
          ))}
        </div>
        <button
          onClick={handleRepondre}
          disabled={!selectedRep || loading}
          className="mt-8 w-full bg-ata-green text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Répondre et passer à la suite'}
        </button>
      </div>
    </div>
  );
}