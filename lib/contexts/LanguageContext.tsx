'use client'

import { createContext, useContext, useState, useEffect } from 'react'

export const LANGUAGES = ['English', 'Kannada', 'Hindi', 'Telugu', 'Tamil', 'Malayalam', 'Marathi']

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {}
})

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState('English')

  useEffect(() => {
    const saved = localStorage.getItem('interia_lang')
    if (saved && LANGUAGES.includes(saved)) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('interia_lang', lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
