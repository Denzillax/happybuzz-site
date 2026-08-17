"use client";
import {
  Laptop, Monitor, Tablet, Printer, Wifi, Cpu, Code, Plug,
  Smartphone, Shield, BatteryCharging, Watch, Phone,
  Gamepad2, Gamepad, Joystick,
  Tv, Headphones, Speaker, Music, Play,
  Camera, Aperture, Video,
  Shirt, Baby, ShoppingBag,
  Dumbbell, Mountain, Tent, Waves,
  Sofa, Lightbulb, Bed,
  Car, Bike, Truck,
  BookOpen, GraduationCap,
  Heart, Briefcase, Gem, Ticket, Home, Package,
  Wrench, Puzzle, Layers, Coins,
  Guitar, Piano, Drum,
  Footprints, Glasses, Flower, Table, DoorOpen,
  Plane, CircleDot, Clapperboard,
  HardDrive, Keyboard, Box, Clock, Brush, Train, Pencil, MapPin, Sparkles, Handshake,
  PawPrint,
} from "lucide-react";

const ICON_MAP = {
  Laptop, Monitor, Tablet, Printer, Wifi, Cpu, Code, Plug,
  Smartphone, Shield, BatteryCharging, Watch, Phone,
  Gamepad2, Gamepad, Joystick, Disc: Gamepad2, Disc3: Music,
  Tv, Headphones, Speaker, Music, Play,
  Camera, Aperture, Video,
  Shirt, Baby, ShoppingBag,
  Dumbbell, Mountain, Tent, Waves, CircleDot,
  Sofa, Lightbulb, Bed, Table, DoorOpen, Flower,
  Car, Bike, Truck,
  BookOpen, GraduationCap, Clapperboard,
  Heart, Briefcase, Gem, Ticket, Home, Package,
  Wrench, Puzzle, Layers, Coins, Stamp: Layers,
  Guitar, Piano, Drum,
  Footprints, Glasses, Plane,
  CookingPot: Wrench,
  HardDrive, Keyboard, Box, Clock, Brush, Train, Pencil, MapPin, Sparkles,
  Wine: Briefcase, Handshake, HandHelping: Handshake,
  PawPrint,
};

/**
 * Gibt die Lucide-Icon-Komponente für einen String-Namen zurück.
 * Fallback: Package
 */
export function getCategoryIcon(iconName) {
  return ICON_MAP[iconName] || Package;
}

/**
 * Rendert ein Kategorie-Icon direkt.
 */
export function CategoryIcon({ name, size = 20, color = "currentColor", ...rest }) {
  const Icon = getCategoryIcon(name);
  return <Icon size={size} color={color} {...rest} />;
}
