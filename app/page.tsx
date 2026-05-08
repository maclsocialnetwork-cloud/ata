'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const LOGOS = [
  'Orange CI',
  "MTN Côte d'Ivoire",
  'Wave Africa',
  'CinetPay',
  'Jumia',
  'Moov Africa',
  'SIB Banque',
  'NSIA Banque',
  'Canal+',
  'Ecobank',
]

const PHRASES_ROTATIVES = [
  "Prouve ton savoir, utilise ta grâce, gagne des lots exceptionnels.",
  "Prouvez votre valeur, utilisez notre expertise, gagnez la confiance et la croissance.",
]

export default function PageLanding() {
  const logosDuplicates = [...LOGOS, ...LOGOS]
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % PHRASES_ROTATIVES.length)
        setVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/logo-ata.jpg"
              alt="ATA Logo"
              width={40}
              height={40}
              className="rounded-full object-cover"
            />
            <span className="text-ata-blue text-sm md:text-base font-semibold">
              Achat Tombola Afrique
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-ata-blue transition-colors">
              Accueil
            </Link>
            <Link
              href="/connexion"
              className="bg-ata-orange text-white text-sm font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
            >
              Connexion
            </Link>
          </div>
        </div>
      </nav>

      <main className="min-h-screen bg-white flex flex-col">

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <section className="bg-ata-blue text-white pt-16 pb-24 px-4 text-center relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -bottom-32 -right-16 w-80 h-80 rounded-full bg-ata-orange/10 pointer-events-none" />

          <div className="relative max-w-3xl mx-auto">
            {/* Accroche au-dessus du logo */}
            <p className="text-lg sm:text-2xl font-extrabold mb-6 tracking-wide">
              <span className="text-ata-green">L&apos;UNIVERS</span>{' '}
              <span className="text-ata-orange">DES CHAMPIONS</span>
            </p>

            {/* Logo / Identité */}
            <div className="mb-6 inline-flex flex-col items-center">
              <div className="w-36 h-36 mx-auto rounded-full bg-white shadow-xl flex items-center justify-center overflow-hidden mb-3">
                <Image
                  src="/logo-ata.jpg"
                  alt="ATA Logo"
                  width={140}
                  height={140}
                  className="object-cover rounded-full"
                />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight mt-2 tracking-tight text-center">
                ACHAT TOMBOLA AFRIQUE
              </h1>
            </div>

            {/* Phrase rotative */}
            <p
              className={`text-base md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed transition-opacity duration-400 ${
                visible ? 'opacity-100' : 'opacity-0'
              } ${phraseIndex === 0 ? 'text-blue-200' : 'text-ata-orange'}`}
            >
              {PHRASES_ROTATIVES[phraseIndex]}
            </p>

            <Link
              href="/connexion"
              className="inline-block bg-ata-orange text-white font-extrabold text-lg px-10 py-4 rounded-2xl hover:opacity-90 transition-opacity shadow-lg shadow-orange-500/30 tracking-wide"
            >
              JE ME LANCE
            </Link>
          </div>
        </section>

        {/* ── DEUX BLOCS ───────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Participants */}
            <div className="rounded-3xl border-2 border-ata-green/30 bg-gradient-to-br from-ata-green/5 to-white p-8 flex flex-col gap-5">
              <div className="w-14 h-14 rounded-2xl bg-ata-green/10 flex items-center justify-center text-3xl">
                🎯
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-ata-blue mb-3">
                  Pour les participants
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Utilise ton temps sur les réseaux sociaux pour{' '}
                  <strong className="text-ata-green">gagner des gains et des lots</strong>.
                  Participe, prouve ton savoir, utilise ta grâce et Gagne !
                </p>
              </div>
              <Link
                href="/connexion"
                className="mt-auto inline-flex items-center gap-2 text-ata-green font-semibold text-sm hover:underline"
              >
                Créer mon compte gratuit →
              </Link>
            </div>

            {/* Entreprises */}
            <div className="rounded-3xl border-2 border-ata-orange/30 bg-gradient-to-br from-ata-orange/5 to-white p-8 flex flex-col gap-5">
              <div className="w-14 h-14 rounded-2xl bg-ata-orange/10 flex items-center justify-center text-3xl">
                🏢
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-ata-blue mb-3">
                  Pour les entreprises
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Le meilleur moyen d&apos;entretenir sa communauté est autour d&apos;une mécanique{' '}
                  <strong className="text-ata-orange">ludique et intellectuelle</strong>{' '}
                  pour hacker sa croissance. Crée, engage ton audience, récompense leur savoir, et Croît !
                </p>
              </div>
              <Link
                href="/connexion"
                className="mt-auto inline-flex items-center gap-2 text-ata-orange font-semibold text-sm hover:underline"
              >
                Créer un espace entreprise →
              </Link>
            </div>

          </div>
        </section>

        {/* ── COMMENT ÇA MARCHE ? ──────────────────────────────────── */}
        <section className="py-20 px-4 bg-ata-blue text-white">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2">
              Comment ça marche ?
            </h2>
            <p className="text-blue-200">En 3 étapes simples</p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                num: '01',
                titre: 'Inscris-toi',
                texte: 'Crée ton compte gratuitement en moins de 2 minutes.',
              },
              {
                num: '02',
                titre: 'Participe / Crée',
                texte: 'À un concours ou à une tombola.',
              },
              {
                num: '03',
                titre: 'Gagne / Croît',
                texte: "Parviens à l'indépendance financière ; Scale ton business.",
              },
            ].map(({ num, titre, texte }) => (
              <div key={num} className="bg-white/10 rounded-2xl p-6 text-center">
                <span className="text-4xl font-extrabold text-ata-orange">{num}</span>
                <h3 className="text-lg font-bold mt-3 mb-2">{titre}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{texte}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/connexion"
              className="inline-block bg-ata-orange text-white font-extrabold text-base px-8 py-4 rounded-2xl hover:opacity-90 transition-opacity"
            >
              JE ME LANCE
            </Link>
          </div>
        </section>

        {/* ── POURQUOI PARTICIPER ? ─────────────────────────────────── */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ata-blue text-center mb-12">
              Pourquoi participer ?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icone: '🔍',
                  titre: '100 % transparent',
                  texte: 'Chaque tirage et chaque résultat sont publics, vérifiables et accessibles à tous.',
                },
                {
                  icone: '💡',
                  titre: '1 modèle unique et innovant',
                  texte: "Une mécanique qui allie jeu, savoir et récompense comme nulle part ailleurs en Afrique.",
                },
                {
                  icone: '🧘',
                  titre: '0 addiction compulsive',
                  texte: 'Un système conçu pour stimuler l\'intellect, pas créer de dépendance.',
                },
              ].map(({ icone, titre, texte }) => (
                <div
                  key={titre}
                  className="rounded-2xl bg-ata-blue/5 border border-ata-blue/10 p-6 text-center flex flex-col items-center gap-3"
                >
                  <span className="text-4xl">{icone}</span>
                  <h3 className="font-extrabold text-ata-blue text-base">{titre}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{texte}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── NOS VALEURS ──────────────────────────────────────────── */}
        <section className="py-20 px-4 bg-ata-blue/5">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-ata-blue text-center mb-12">
              Nos valeurs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              {[
                {
                  couleur: 'border-ata-orange/40 bg-ata-orange/5',
                  accent: 'text-ata-orange',
                  titre: 'Accompagner',
                  texte:
                    "Nous accompagnons les entreprises dans leurs promotions et vous aidons à devenir un véritable professionnel du marketing digital.",
                },
                {
                  couleur: 'border-ata-blue/30 bg-ata-blue/5',
                  accent: 'text-ata-blue',
                  titre: 'Transformer',
                  texte:
                    "Nous transformons les campagnes publicitaires traditionnelles en expériences ludiques et engageantes qui captivent votre audience.",
                },
                {
                  couleur: 'border-ata-green/40 bg-ata-green/5',
                  accent: 'text-ata-green',
                  titre: 'Accroître',
                  texte:
                    "Nous accroissons les revenus de nos ambassadeurs et partenaires grâce à un système de rémunération transparent et équitable.",
                },
              ].map(({ couleur, accent, titre, texte }) => (
                <div
                  key={titre}
                  className={`rounded-2xl border-2 ${couleur} p-7 flex flex-col gap-3`}
                >
                  <h3 className={`font-extrabold text-xl ${accent}`}>{titre}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{texte}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
              Notre spécialité : des tombolas et jeux concours certifiés, 100% transparents, et socialement impactants.
              Chaque campagne est conçue pour créer de la valeur pour tous les participants.
            </p>
          </div>
        </section>

        {/* ── CTA CENTRAL ──────────────────────────────────────────── */}
        <section className="py-16 px-4 bg-white text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ata-blue mb-4">
            Prêt(e) à rejoindre l&apos;aventure ?
          </h2>
          <p className="text-gray-500 mb-8 max-w-xl mx-auto">
            Crée ton compte gratuitement et commence à participer ou à lancer tes propres tombolas.
          </p>
          <Link
            href="/connexion"
            className="inline-block bg-ata-orange text-white font-extrabold text-xl px-12 py-5 rounded-2xl hover:opacity-90 transition-opacity shadow-xl shadow-orange-400/30 tracking-wide"
          >
            JE ME LANCE
          </Link>
        </section>

        {/* ── CARROUSEL "ILS NOUS FONT CONFIANCE" ──────────────────── */}
        <section className="py-16 bg-gray-50 overflow-hidden">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">
            Ils nous font confiance
          </p>
          <div className="overflow-hidden">
            <div className="carrousel-defilement flex gap-6 w-max">
              {logosDuplicates.map((nom, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 bg-white border border-gray-100 rounded-xl px-6 py-3 text-sm font-semibold text-gray-500 whitespace-nowrap shadow-sm"
                >
                  {nom}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────── */}
        <footer className="bg-gray-900 text-white pt-12 pb-8 px-4">
          <div className="max-w-5xl mx-auto">

            {/* Identité */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white overflow-hidden shadow-lg mb-3">
                <Image
                  src="/logo-ata.jpg"
                  alt="ATA Logo"
                  width={64}
                  height={64}
                  className="object-cover rounded-full"
                />
              </div>
              <p className="text-gray-400 text-sm">Achat Tombola Afrique</p>
            </div>

            {/* Liens */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10">
              {/* Liens utiles */}
              <div>
                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                  Liens utiles
                </h4>
                <ul className="flex flex-col gap-2">
                  {[
                    { label: 'Accueil', href: '/' },
                    { label: 'Contactez-nous', href: '#' },
                    { label: 'Blog', href: '#' },
                    { label: 'Services', href: '#' },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-gray-400 text-sm hover:text-white transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Réseaux sociaux */}
              <div>
                <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
                  Nos réseaux
                </h4>
                <ul className="flex flex-col gap-2">
                  {[
                    { label: 'Facebook', href: '#' },
                    { label: 'Twitter / X', href: '#' },
                    { label: 'Instagram', href: '#' },
                    { label: 'LinkedIn', href: '#' },
                    { label: 'YouTube', href: '#' },
                  ].map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-gray-400 text-sm hover:text-white transition-colors"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Verset */}
            <blockquote className="border-l-4 border-ata-orange pl-5 mb-8 max-w-2xl mx-auto">
              <p className="text-gray-300 text-sm italic leading-relaxed">
                « La sagesse est une protection, comme l&apos;argent est une protection ; mais l&apos;avantage
                de la connaissance, c&apos;est que la sagesse fait vivre ceux qui la possèdent. »
              </p>
              <cite className="text-gray-500 text-xs mt-2 block">— Ecclésiaste 7:12</cite>
            </blockquote>

            {/* Phrase finale + copyright */}
            <div className="border-t border-gray-800 pt-6 text-center space-y-2">
              <p className="text-ata-orange font-semibold text-sm">
                Grâce et savoir vont de pair – à toi le game !
              </p>
              <p className="text-gray-600 text-xs">
                © 2026 ATA – Achat Tombola Afrique – Jeux concours QCM &amp; Tombola
              </p>
            </div>

          </div>
        </footer>

      </main>
    </>
  )
}
