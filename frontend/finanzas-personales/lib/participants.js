export function toParticipantTerminology(message) {
  return message.replace(/\bmiembros?\b/gi, (term) => {
    const replacement = term.toLowerCase().endsWith("s")
      ? "participantes"
      : "participante";
    return term[0] === term[0].toUpperCase()
      ? replacement[0].toUpperCase() + replacement.slice(1)
      : replacement;
  });
}