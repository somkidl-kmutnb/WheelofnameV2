/**
 * Classroom Team & Group Generator
 */
export function generateGroups(namesList, numGroups = 2, shuffleFirst = true) {
  if (!namesList || namesList.length === 0) return [];

  let list = [...namesList];
  if (shuffleFirst) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  }

  const validGroupCount = Math.max(1, Math.min(numGroups, list.length));
  const groups = Array.from({ length: validGroupCount }, (_, i) => ({
    name: `กลุ่มที่ ${i + 1}`,
    members: []
  }));

  list.forEach((name, index) => {
    groups[index % validGroupCount].members.push(name);
  });

  return groups;
}
