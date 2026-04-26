import {
  Smartphone, Car, Shirt, Home, Laptop, Palette, Utensils, Store, ShoppingCart,
  Scissors, Package, Wrench, Music, Camera, Briefcase, Hammer, Sparkles, Leaf,
  GraduationCap, BookOpen, Brain, Code, Languages, Calculator, Microscope, Globe,
  Library, Pencil, Clock, CheckSquare, Wallet, BarChart3, CreditCard, Settings,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  smartphone: Smartphone, car: Car, shirt: Shirt, home: Home, laptop: Laptop,
  palette: Palette, utensils: Utensils, store: Store, "shopping-cart": ShoppingCart,
  scissors: Scissors, package: Package, wrench: Wrench, music: Music, camera: Camera,
  briefcase: Briefcase, hammer: Hammer, sparkles: Sparkles, leaf: Leaf,
  "graduation-cap": GraduationCap, "book-open": BookOpen, brain: Brain, code: Code,
  languages: Languages, calculator: Calculator, microscope: Microscope, globe: Globe,
  library: Library, pencil: Pencil, clock: Clock, "check-square": CheckSquare,
  wallet: Wallet, "bar-chart-3": BarChart3, "credit-card": CreditCard, settings: Settings,
};

export function getIcon(name: string): LucideIcon {
  return ICONS[name] || Package;
}

export function Icon({ name, className, size = 18 }: { name: string; className?: string; size?: number }) {
  const Cmp = getIcon(name);
  return <Cmp className={className} size={size} />;
}
