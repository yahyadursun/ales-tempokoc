# TempoKoç ⏱️

> **TempoKoç**: ALES, YDS, YÖKDİL, TUS, DUS ve YKS adayları için hem **Soru Başına Süreyi (Pacer)** hem **Genel Resmi Sınav Süresini** eşzamanlı takip eden, süre aşımında sesli/görsel uyarı veren zaman yönetimi asistanı.

---

## 🌟 Öne Çıkan Özellikler

- **⏱️ Çift Kronometre Düzeneği (Twin Timers)**:
  - **Soru Sayacı**: Her soru için hedef süreyi ve anlık aşım süresini (`+00:15`) takip eden dairesel halka.
  - **Genel Sınav Kronometresi**: Resmi sınav süresinden kalan dakikaları (`02:14:35`) ve sınav genel temposunu gösteren ana sayaç.

- **🏛️ Resmi YÖK & ÖSYM Sınav Şablonları**:
  - **ALES Sayısal**: 50 Soru | 90s / Soru | 75 Dk Sınav
  - **ALES Sözel**: 50 Soru | 60s / Soru | 75 Dk Sınav
  - **ALES Tam Deneme**: 100 Soru | 90s / Soru | 150 Dk Sınav
  - **YDS / e-YDS**: 80 Soru | 135s / Soru | 180 Dk Sınav
  - **YÖKDİL**: 80 Soru | 135s / Soru | 180 Dk Sınav
  - **TUS (Tıp)**: 100 Soru | 81s / Soru | 135 Dk Sınav
  - **DUS (Diş Hekimliği)**: 120 Soru | 75s / Soru | 150 Dk Sınav
  - **YKS - TYT**: 120 Soru | 83s / Soru | 165 Dk Sınav
  - **Özel Sınav Modu**: Serbest süre ve soru sayısı ayarlama.

- **🔊 Web Audio API Ses & Ekran Uyarısı**:
  - Süre dolduğunda sesli melodi, ekran flaşı ve son 5 saniyede geri sayım biplemesi.

- **⌨️ Klavye Kısayolları**:
  - `Space` / `Enter` ➔ **Çözdüm / Sonraki Soru**
  - `B` ➔ **Boş / Pas** (Stratejik Pas Takibi)
  - `P` ➔ **Duraklat / Devam Et**
  - `R` ➔ **Sıfırla**

- **📊 Grafikli İpuçları & Rapor**:
  - Chart.js zaman analizi, süre aşımı metrikleri ve `localStorage` geçmiş kaydı.

---

## 🚀 Kurulum & Çalıştırma

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirici sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173/` adresine gidin.
