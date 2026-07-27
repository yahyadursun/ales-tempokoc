# ALES TempoKoç ⏱️

> **ALES (Akademik Personel ve Lisansüstü Eğitimi Giriş Sınavı)** adayları için soru başına düşen zamanı etkili yönetme, süre aşımında bildirim alma ve zaman yönetimini alışkanlığa dönüştürme uygulaması.

![Project Banner](public/banner.png)

## 🌟 Öne Çıkan Özellikler

- **🎯 ALES Sınav Modları (Presets)**:
  - **ALES Sayısal Modu**: 50 Soru | 90 Sn / Soru
  - **ALES Sözel Modu**: 50 Soru | 60 Sn / Soru
  - **ALES Eşit Ağırlık Modu**: 50 Soru | 75 Sn / Soru
  - **Özel Pratik Modu**: İstenen soru sayısı (5-100) ve hedef süre (15-300sn).

- **⏳ Canlı Dairesel Süre Halkası & Overtime (Aşım) Takibi**:
  - Süre aktıkça renk değiştiren animasyonlu halka (Yeşil ➔ Sarı ➔ Kırmızı).
  - Süre bittiğinde anlık artan canlı **Aşım Sayacı (`+00:15`)** ve visual alert parlaması.
  - Son 5 saniyede geri sayım sesli biplemesi.

- **🔊 Web Audio API Ses Motoru**:
  - Dışarıdan dosya indirme gerektirmeyen sıfır gecikmeli ses sentezleyici (Chime, Bell, Beep, Digital).

- **⌨️ Hızlı Klavye Kısayolları (Kâğıt Üzerinde Çözerken Kullanım)**:
  - `Space` / `Enter` ➔ **Çözdüm / Sonraki Soru**
  - `B` ➔ **Boş / Pas** (4 yanlış 1 doğruyu götürdüğü için boş bırakma stratejisi)
  - `P` ➔ **Duraklat / Devam Et**
  - `R` ➔ **Sıfırla**

- **📊 Grafikli İstatistikler & Geçmiş Raporları**:
  - **Chart.js** ile her sorunun harcanan süresini hedef çizgiyle kıyaslayan bar grafik.
  - Oturum geçmişini `localStorage` ile tarayıcıda saklama.

---

## 🛠️ Teknolojiler

- **Core**: HTML5, JavaScript (ES6+), CSS3
- **Build Tool**: Vite
- **Styling**: Tailwind CSS CDN & Custom Glassmorphism System
- **Graphics & Sound**: Chart.js, Web Audio API, Canvas Confetti

---

## 🚀 Yerelde Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için:

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirici sunucusunu başlatın
npm run dev
```

Tarayıcınızda `http://localhost:5173/` adresine gidin.

---

## 📦 Production Build

```bash
npm run build
```

Derlenen dosyalar `dist/` klasörüne oluşturulur.
