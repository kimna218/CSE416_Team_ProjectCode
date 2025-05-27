
export type Lang = "ko" | "en";

const LANG_KEY = "lang";

export const getCurrentLang = (): Lang => {
  return (localStorage.getItem(LANG_KEY) as Lang) || "ko";
};

export const setCurrentLang = (lang: Lang) => {
  localStorage.setItem(LANG_KEY, lang);
  window.location.reload(); 
};
