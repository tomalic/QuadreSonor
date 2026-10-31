# Quadre sonor

PWA sense dependències. Serveix `dist/` per HTTPS (o localhost per fer proves).

1. Obre i instal·la l’app al dispositiu final.
2. Carrega la imatge i les cançons des del menú inicial. Es desen a IndexedDB del dispositiu, sense pujar-les a cap servidor.
3. Prem «Posar l’obra en marxa». Un toc inicia una cançó aleatòria; no repeteix l’anterior si n’hi ha més d’una. Els tocs durant la reproducció s’ignoren, excepte quatre tocs ràpids amb dos dits alhora en menys de 2,8 segons, aixecant tots dos dits entre tocs, que obren els controls. La cançó acaba sense continuar amb una altra.
4. Instal·la el bloqueig propi del dispositiu (Accés guiat a iPad, app fixada o mode quiosc a Android). Una PWA no pot bloquejar els controls del sistema ni tancar-se de manera fiable.
5. Comprova reproducció completa, quatre tocs amb dos dits, volum, pantalla activa, reinici i mode avió al dispositiu real. Mantén una còpia dels fitxers originals. El sistema pot alliberar el permís de pantalla activa o eliminar dades locals sota pressió d’espai.

La imatge inclosa és una composició SVG de mostra; no hi ha cançons de demostració. Els fitxers carregats són locals a cada instal·lació. Per distribuir les cançons preinstal·lades dins el paquet cal incorporar els fitxers definitius al projecte.
