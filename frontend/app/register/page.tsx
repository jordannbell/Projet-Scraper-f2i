'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Stepper, { Step } from '@/components/Stepper';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    targetJob: 'Data Analyst',
    skills: 'python, sql',
    experienceLevel: 'junior'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFinalSubmit = () => {
    // Here implies sending data to backend
    console.log("Submitting:", formData);
    // Simulate API call
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <Link href="/" className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
          Seekra
        </Link>
        <p className="mt-2 text-slate-500">Créez votre profil en quelques étapes.</p>
      </div>

      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <Stepper
          initialStep={1}
          onFinalStepCompleted={handleFinalSubmit}
          backButtonText="Précédent"
          nextButtonText="Suivant"
          stepCircleContainerClassName="shadow-none border-0 max-w-none"
        >
          <Step>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Vos Informations</h2>
              <p className="text-slate-500 text-sm">Commençons par les bases.</p>
            </div>

            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prénom</label>
                  <input
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                  <input
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    type="text"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="jean.dupont@exemple.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  type="password"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </Step>

          <Step>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Votre Cible</h2>
              <p className="text-slate-500 text-sm">Dites-nous ce que vous recherchez.</p>
            </div>

            <div className="grid gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Intitulé du poste visé</label>
                <input
                  name="targetJob"
                  value={formData.targetJob}
                  onChange={handleChange}
                  type="text"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ex: Data Scientist, Chef de Projet..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Niveau d'expérience</label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleChange}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="junior">Junior (0-2 ans)</option>
                  <option value="intermediaire">Intermédiaire (2-5 ans)</option>
                  <option value="senior">Senior (5+ ans)</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
          </Step>

          <Step>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Vos Atouts</h2>
              <p className="text-slate-500 text-sm">Quelles sont vos compétences clés ?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Compétences (tags)</label>
              <input
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                type="text"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Python, React, Marketing..."
              />
              <p className="text-xs text-slate-400 mt-2">Séparez les compétences par des virgules.</p>
            </div>

            <div className="mt-8 p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex items-start">
              <div className="text-indigo-600 mr-3 mt-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <p className="text-sm text-indigo-700">
                Seekra utilisera ces informations pour calibrer l'intelligence artificielle et trouver les offres qui vous correspondent le mieux dès votre première connexion.
              </p>
            </div>
          </Step>
        </Stepper>
      </div>

      <p className="mt-8 text-center text-sm text-slate-400">
        Déjà un compte ? <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">Se connecter</Link>
      </p>
    </div>
  );
}
