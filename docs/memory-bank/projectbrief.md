# Proje Özeti (Project Brief)

## Proje Adı: Air Quality Monitoring for Schools
Bu proje, okullardaki hava kalitesini izlemek ve yönetmek amacıyla geliştirilen sensör tabanlı bir web sistemidir. Projenin amacı, sınıfların iç mekan (indoor) ve okulların genel (outdoor) hava durumlarını (CO₂, sıcaklık, nem) ölçümleyerek gerçek zamanlı olarak admin ve okul yönetimine sunmaktır.

## Temel Gereksinimler (Core Requirements)
- **Kapsam:** Okullar ve bunlara bağlı sınıflar.
- **Sensör Verisi:** Gerçek zamanlı CO₂, Sıcaklık, Nem ve Batarya verileri toplanmalıdır.
- **Uyarı Mekanizmaları:** CO₂ değerleri ve batarya yüzdesi eşik değerleri (thresholds) doğrultusunda renkli/görsel uyarılar verilmelidir.
- **Dashboards:** 
  - Yönetici (Admin) Paneli: Okul, sınıf ve sensör tanımlama işlemleri.
  - Okul Paneli: Sınıf bazlı gerçek zamanlı hava kalite durumları, grafikler ve uyarılar.
- **Simülatör:** Gerçek donanım olmadan veritabanına veri akışı sağlayacak bağımsız bir Node.js servisi oluşturulmalıdır.
