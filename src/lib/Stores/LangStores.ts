import { browser } from "$app/environment";
import { writable } from "svelte/store";

// Cookie'den dil bilgisini al
function getCookie(name: string) {
  if (!browser) return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Cookie'ye dil bilgisini yaz
function setCookie(name: string, value: string, days = 365) {
  if (!browser) return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

// Varsayılan dili cookie'den al, yoksa 'en'
const initialLang = browser ? getCookie("currentLang") || "en" : "en";

// Store oluştur
export const currentLanguage = writable(initialLang);

// Store değiştiğinde cookie'yi güncelle
currentLanguage.subscribe((val) => {
  if (browser) setCookie("currentLang", val);
});