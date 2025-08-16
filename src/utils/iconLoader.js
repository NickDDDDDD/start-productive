const PACK_IMPORTERS = {
  ai: () => import("react-icons/ai"),
  lu: () => import("react-icons/lu"),
  fa: () => import("react-icons/fa"),
  fi: () => import("react-icons/fi"),
  fc: () => import("react-icons/fc"),
  hi: () => import("react-icons/hi"),
  io: () => import("react-icons/io"),
  md: () => import("react-icons/md"),
  ri: () => import("react-icons/ri"),
};

export async function loadIconById(iconId) {
  if (!iconId) throw new Error("Empty icon id");
  const [rawPack, rawName] = iconId.trim().split("/");
  const pack = (rawPack || "").toLowerCase();
  const name = (rawName || "").trim();
  if (!pack || !name) throw new Error('Icon id must be like "ai/AiFillChrome"');

  const importPack = PACK_IMPORTERS[pack];
  if (!importPack) throw new Error(`Unsupported icon pack: ${pack}`);

  const mod = await importPack();
  const IconComponent = mod[name];
  if (!IconComponent)
    throw new Error(`Icon "${name}" not found in pack "${pack}"`);
  return IconComponent;
}
