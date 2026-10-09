---
date: 2026-10-09
status: accepted
---
# Rythme simplifié et métronome planifié à l'avance
**Context:** ajout de la mesure, du tempo, du métronome et des durées de notes à une partition jouée en direct.
**Decision:** la durée d'une note est arrondie à la valeur la plus proche (de la double croche à la ronde), sans silences ni liaisons ; l'accord encore tenu s'affiche en noire. Le métronome programme ses clics à l'avance sur l'horloge audio du navigateur, avec un petit minuteur de réapprovisionnement.
**Reason:** la partition reste lisible à 1 m et simple à maintenir ; l'horloge audio évite la dérive d'un minuteur seul, et le temps affiché est lancé à l'heure du clic.
**Rejected alternatives:** silences et notes liées entre mesures (partition chargée, long à mettre au point) ; un minuteur seul pour chaque clic (dérive audible) ; un fichier audio de clic (ressource en plus, pas d'accent simple).
