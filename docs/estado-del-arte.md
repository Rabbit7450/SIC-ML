# Estado del arte

Objetivo: ≥ 20 referencias APA y una matriz de trabajos relacionados (IDS+ML, criptografía ligera, OWASP, phishing). Completar columnas de “hallazgo propio” al leer cada fuente.

## Referencias (APA 7)

Abu-Nimeh, S., Nappa, D., Wang, X., & Nair, S. (2007). A comparison of machine learning techniques for phishing detection. *Proceedings of the Anti-Phishing Working Groups 2nd Annual eCrime Researchers Summit*, 60–69.

Al-Garadi, M. A., Mohamed, A., Al-Ali, A. K., Du, X., Ali, I., & Guizani, M. (2020). A survey of machine and deep learning methods for Internet of Things (IoT) security. *IEEE Communications Surveys & Tutorials*, 22(3), 1646–1685.

Bernstein, D. J. (2008). *ChaCha, a variant of Salsa20*. https://cr.yp.to/chacha/chacha-20080128.pdf

Buczak, A. L., & Guven, E. (2016). A survey of data mining and machine learning methods for cyber security intrusion detection. *IEEE Communications Surveys & Tutorials*, 18(2), 1153–1176.

Conti, M., Dehghantanha, A., Franke, K., & Watson, S. (2018). Internet of Things security and forensics: Challenges and opportunities. *Future Generation Computer Systems*, 78, 544–546.

Eisenbarth, T., Kumar, S., Paar, C., Poschmann, A., & Uhsadel, L. (2007). A survey of lightweight-cryptography implementations. *IEEE Design & Test of Computers*, 24(6), 522–533.

Krawczyk, H., Bellare, M., & Canetti, R. (1997). *HMAC: Keyed-hashing for message authentication* (RFC 2104). IETF.

Kitterman, S. (2014). *Sender Policy Framework (SPF) for authorizing use of domains in email* (RFC 7208). IETF.

Kucherawy, M., & Zwicky, E. (2015). *Domain-based Message Authentication, Reporting, and Conformance (DMARC)* (RFC 7489). IETF.

McGrew, D., & Viega, J. (2004). The Galois/Counter Mode of operation (GCM). *NIST*.

Mohammad, R. M., Thabtah, F., & McCluskey, L. (2014). Predicting phishing websites based on self-structuring neural network. *Neural Computing and Applications*, 25(2), 443–458.

National Institute of Standards and Technology. (2023). *Lightweight cryptography standardization*. https://csrc.nist.gov/projects/lightweight-cryptography

Nir, Y., & Langley, A. (2018). *ChaCha20 and Poly1305 for IETF protocols* (RFC 8439). IETF.

OWASP Foundation. (2021). *OWASP Top 10:2021*. https://owasp.org/Top10/

Sahingoz, O. K., Buber, E., Demir, O., & Diri, B. (2019). Machine learning based phishing detection from URLs. *Expert Systems with Applications*, 117, 345–357.

Scarfone, K., & Mell, P. (2007). *Guide to intrusion detection and prevention systems (IDPS)* (NIST SP 800-94). NIST.

Sharafaldin, I., Lashkari, A. H., & Ghorbani, A. A. (2018). Toward generating a new intrusion detection dataset and intrusion traffic characterization. *ICISSP*, 108–116.

Shone, N., Ngoc, T. N., Phai, V. D., & Shi, Q. (2018). A deep learning approach to network intrusion detection. *IEEE Transactions on Emerging Topics in Computational Intelligence*, 2(1), 41–50.

Sommer, R., & Paxson, V. (2010). Outside the closed world: On using machine learning for network intrusion detection. *IEEE Symposium on Security and Privacy*, 305–316.

Tavallaee, M., Bagheri, E., Lu, W., & Ghorbani, A. A. (2009). A detailed analysis of the KDD CUP 99 data set. *IEEE Symposium on Computational Intelligence for Security and Defense Applications*.

Vinayakumar, R., Alazab, M., Soman, K. P., Poornachandran, P., Al-Nemrat, A., & Venkatraman, S. (2019). Deep learning approach for intelligent intrusion detection system. *IEEE Access*, 7, 41525–41550.

Crocker, D., Hansen, T., & Kucherawy, M. (2011). *DomainKeys Identified Mail (DKIM) signatures* (RFC 6376). IETF.

## Matriz comparativa (rellenar al leer)

| Trabajo | Año | Enfoque | Dataset / escenario | Fortalezas | Limitación | Relación con SIC-ML |
| --- | --- | --- | --- | --- | --- | --- |
| Buczak y Guven | 2016 | Survey ML para IDS | Varios | Taxonomía clara | Poco IoT | Marco teórico Módulo 1 |
| Sommer y Paxson | 2010 | Crítica ML en IDS | Red | Semantic gap | No propone sistema | Justifica Suricata + ML |
| Tavallaee et al. | 2009 | NSL-KDD | NSL-KDD | Limpieza de KDD99 | Desactualizado | Dataset inicial |
| Sharafaldin et al. | 2018 | CIC-IDS2017 | CIC | Tráfico moderno | Volumen alto | Dataset de extensión |
| Shone et al. | 2018 | Deep autoencoder | NSL-KDD / KDD | No supervisado | Coste cómputo | Comparar vs RF/SVM |
| Vinayakumar et al. | 2019 | DNN IDS | Varios | Benchmark amplio | Caja negra | Red neuronal |
| Al-Garadi et al. | 2020 | Survey IoT+ML | IoT | Panorama | Poco cifrado ligero | FASE 3 |
| Eisenbarth et al. | 2007 | Crypto ligera | Hardware | Overhead | Algoritmos antiguos | AES-CCM / ChaCha |
| NIST LWC | 2023 | Estándar | Constrained | Actualidad | Adopción | Opción de cifrado |
| RFC 8439 | 2018 | ChaCha20-Poly1305 | IETF | AEAD eficiente | CPU vs AES-NI | Opción B |
| OWASP Top 10 | 2021 | Riesgos web | Aplicaciones | Estándar industria | No es IDS | FASE 4 |
| Sahingoz et al. | 2019 | Phishing URLs | URLs | Features léxicas | Evasión | Clasificador F1≥0.90 |
| Abu-Nimeh et al. | 2007 | Phishing ML | Email | Comparación clásica | Features viejas | Baseline |
| RFC 7208/6376/7489 | 2011–2015 | SPF/DKIM/DMARC | Correo | Autenticación | No cubre URLs | Verificador de cabeceras |
| Scarfone y Mell | 2007 | Guía IDPS | NIST | Despliegue | Pre-ML moderno | Laboratorio FASE 1 |
