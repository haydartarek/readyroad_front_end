// Static group metadata for the traffic-signs alphabetical page.
// Descriptions are sourced from category_descriptions.json (backend resource).

export type LangKey = "nl" | "en" | "ar" | "fr";

export interface GroupInfo {
  title: Record<LangKey, string>;
  description: Record<LangKey, string>;
  displayKey?: string; // override the letter shown in the section badge
}

export const GROUP_INFO: Record<string, GroupInfo> = {
  A: {
    title: {
      nl: "Gevaar",
      en: "Danger Signs",
      ar: "علامات الخطر",
      fr: "Panneaux de danger",
    },
    description: {
      nl: "Gevaarsborden zijn gemakkelijk te herkennen aan hun driehoekige vorm met de punt naar boven, rode rand, witte achtergrond en zwarte symbool dat de aard van het gevaar aangeeft.",
      en: "Danger signs are easy to recognise by their triangular shape with the point facing upwards, red border, white background, and black symbol showing the nature of the hazard.",
      ar: "يسهل التعرّف على علامات الخطر من شكلها المثلث ذي الرأس المتجه إلى الأعلى، وإطارها الأحمر وخلفيتها البيضاء، والرمز الأسود الذي يوضح طبيعة الخطر.",
      fr: "Les panneaux de danger se reconnaissent facilement à leur forme triangulaire avec la pointe vers le haut, leur bord rouge, leur fond blanc et leur symbole noir qui indique la nature du danger.",
    },
  },
  B: {
    title: {
      nl: "Voorrang",
      en: "Priority Signs",
      ar: "الأولوية",
      fr: "Panneaux de priorité",
    },
    description: {
      nl: "Voorrangsborden regelen de volgorde van doorgang aan kruispunten en smalle doorgangen. Ze maken duidelijk wie moet wachten en wie voorrang heeft. Naleving helpt verkeerde inschattingen en ongevallen te voorkomen, vooral waar geen verkeerslichten staan.",
      en: "Priority signs regulate the order of traffic at junctions and narrow passages. They show who must wait and who has priority. Following them helps prevent misjudgements and collisions, especially where there are no traffic lights.",
      ar: "تنظّم علامات الأولوية ترتيب المرور عند التقاطعات والممرات الضيقة، وتوضح مَن يجب عليه الانتظار ومَن يملك حق المرور. ويساعد الالتزام بها على تجنب سوء التقدير والحوادث، خاصة في الأماكن التي لا توجد فيها إشارات ضوئية.",
      fr: "Les panneaux de priorité règlent l'ordre de passage aux carrefours et dans les passages étroits. Ils indiquent qui doit attendre et qui a la priorité. Les respecter aide à éviter les erreurs d'appréciation et les accidents, surtout en l'absence de feux.",
    },
  },
  C: {
    title: {
      nl: "Verbod",
      en: "Prohibition Signs",
      ar: "المنع",
      fr: "Panneaux d'interdiction",
    },
    description: {
      nl: "Verbodsborden leggen duidelijke beperkingen op aan bepaalde gedragingen of voertuigtypes op specifieke plaatsen en in bepaalde omstandigheden. De opgelegde beperkingen moeten worden nageleefd.",
      en: "Prohibition signs impose clear restrictions on certain actions or vehicle types in specific places and circumstances. The restrictions shown on these signs must be followed.",
      ar: "تفرض علامات المنع قيودًا واضحة على بعض التصرفات أو أنواع المركبات في أماكن وظروف محددة. ويجب الالتزام بما تفرضه هذه العلامات.",
      fr: "Les panneaux d'interdiction imposent des restrictions claires à certains comportements ou types de véhicules dans des lieux et circonstances précis. Les restrictions qu'ils indiquent doivent être respectées.",
    },
  },
  D: {
    title: {
      nl: "Gebod",
      en: "Mandatory Signs",
      ar: "الإلزام",
      fr: "Panneaux d'obligation",
    },
    description: {
      nl: "Gebodsborden verplichten bestuurders en andere weggebruikers een bepaalde richting te volgen of zich op een bepaalde manier te gedragen. Het zijn rechtstreekse bevelen die moeten worden uitgevoerd om de verkeersdoorstroming en de verkeersveiligheid te beschermen.",
      en: "Mandatory signs require drivers and other road users to follow a specific direction or course of action. They are direct instructions that must be obeyed to support smooth traffic flow and road safety.",
      ar: "تُلزم علامات الإلزام السائقين ومستخدمي الطريق باتباع اتجاه أو تصرف محدد. وهي أوامر مباشرة يجب تنفيذها للمحافظة على انسيابية حركة السير والسلامة على الطريق.",
      fr: "Les panneaux d'obligation imposent aux conducteurs et aux autres usagers de suivre une direction ou un comportement précis. Ce sont des ordres directs qui doivent être exécutés pour préserver la fluidité et la sécurité de la circulation.",
    },
  },
  E: {
    title: {
      nl: "Parkeren / Stilstaan",
      en: "Stopping & Parking",
      ar: "الوقوف والركن",
      fr: "Arrêt et stationnement",
    },
    description: {
      nl: "Borden voor stilstaan en parkeren regelen waar en wanneer voertuigen langs de weg mogen stilstaan of parkeren. Naleving helpt verkeershinder te voorkomen, vooral in drukke stedelijke gebieden.",
      en: "Stopping and parking signs regulate where and when vehicles may stop or park at the side of the road. Following them helps prevent obstruction, especially in busy urban areas.",
      ar: "تنظّم علامات الوقوف والركن الأماكن والأوقات التي يُسمح فيها للمركبات بالتوقف أو الركن على جانب الطريق. ويساعد الالتزام بها على تجنب عرقلة حركة السير، خاصة في المناطق الحضرية المزدحمة.",
      fr: "Les panneaux d'arrêt et de stationnement règlent les endroits et les moments où les véhicules peuvent s'arrêter ou stationner au bord de la route. Les respecter aide à éviter de gêner la circulation, surtout dans les zones urbaines très fréquentées.",
    },
  },
  F: {
    title: {
      nl: "Aanwijzing",
      en: "Information Signs",
      ar: "إرشادات",
      fr: "Panneaux d'indication",
    },
    // No displayKey — letter 'F' is shown in badge as-is
    description: {
      nl: "Aanwijzingsborden begeleiden weggebruikers en geven informatie over bestemmingen of nabijgelegen diensten. Sommige kunnen ook een aanwijzing bevatten die moet worden gevolgd.",
      en: "Information signs guide road users and provide information about destinations or nearby services. Some may also contain an instruction that must be followed.",
      ar: "توجّه العلامات الإرشادية مستخدمي الطريق، وتزودهم بمعلومات عن الوجهات أو الخدمات القريبة. وقد تتضمن بعض هذه العلامات تعليمات يجب الالتزام بها.",
      fr: "Les panneaux d'indication guident les usagers et donnent des informations sur les destinations ou les services à proximité. Certains peuvent aussi contenir une instruction qui doit être respectée.",
    },
  },
  FM: {
    displayKey: "F",
    title: {
      nl: "Wegmarkering",
      en: "Road Marking Signs",
      ar: "علامات تنظيم المسارات",
      fr: "Panneaux de marquage routier",
    },
    description: {
      nl: "Borden voor rijstrookorganisatie tonen tijdelijke wijzigingen aan het verloop van de weg, zoals een versmalling of verlegging van rijstroken. Ze worden vaak bij wegenwerken gebruikt om weggebruikers te leiden en hun veiligheid en die van de werknemers te beschermen.",
      en: "Lane-management signs show temporary changes to the path of traffic, such as lane narrowing or diversion. They are often used at roadworks to guide road users and protect both them and the workers.",
      ar: "توضح علامات تنظيم المسارات التغييرات المؤقتة في مسار السير، مثل تضييق المسارات أو تحويلها. وتُستخدم غالبًا أثناء أعمال الطرق لتوجيه مستخدمي الطريق والمحافظة على سلامتهم وسلامة العاملين.",
      fr: "Les panneaux d'organisation des bandes signalent des modifications temporaires du tracé, comme un rétrécissement ou une déviation de bande. Ils sont souvent utilisés lors de travaux pour guider les usagers et protéger leur sécurité ainsi que celle des travailleurs.",
    },
  },
  G: {
    title: {
      nl: "Onderborden",
      en: "Supplementary Panels",
      ar: "لوحات إضافية",
      fr: "Panneaux additionnels",
    },
    description: {
      nl: "Onderborden worden onder een hoofdbord geplaatst om de betekenis ervan te verduidelijken, het toepassingsgebied te bepalen of specifieke uitzonderingen en voorwaarden aan te geven.",
      en: "Supplementary panels are placed below a main sign to clarify its meaning, define its scope, or indicate specific exceptions and conditions.",
      ar: "تُوضع اللوحات الإضافية أسفل علامة رئيسية لتوضيح معناها أو تحديد نطاق تطبيقها أو بيان استثناءات وشروط معينة.",
      fr: "Les panneaux additionnels sont placés sous un panneau principal pour en préciser le sens, définir son champ d'application ou indiquer des exceptions et conditions particulières.",
    },
  },
  M: {
    title: {
      nl: "Fiets / Bromfiets onderborden",
      en: "Cycle / Moped Panels",
      ar: "لوحات الدراجات والدراجات البخارية",
      fr: "Panneaux vélos / cyclomoteurs",
    },
    description: {
      nl: "Deze onderborden geven aanvullende informatie voor fietsers, bromfietsers, bestuurders van elektrische fietsen en andere gebruikers van lichte voertuigen. Ze verduidelijken hoe het hoofdbord op deze groepen van toepassing is.",
      en: "These panels provide additional information for cyclists, moped riders, electric-bike riders, and other users of light vehicles. They explain how the main sign applies to these groups.",
      ar: "تقدم هذه اللوحات معلومات إضافية تخص راكبي الدراجات والدراجات البخارية والدراجات الكهربائية وغيرهم من مستخدمي المركبات الخفيفة. وتوضح كيفية تطبيق العلامة الرئيسية على هذه الفئات.",
      fr: "Ces panneaux donnent des informations supplémentaires aux cyclistes, cyclomotoristes, utilisateurs de vélos électriques et autres usagers de véhicules légers. Ils précisent comment le panneau principal s'applique à ces catégories.",
    },
  },
  T: {
    title: {
      nl: "Afbakeningsborden",
      en: "Delineation Signs",
      ar: "علامات الإرشاد الطرقي",
      fr: "Panneaux de balisage",
    },
    description: {
      nl: "Afbakeningsborden leiden de bestuurder naar het juiste traject, vooral bij bochten, versmallingen of obstakels. Ze tonen welk traject moet worden gevolgd om gevaar te vermijden.",
      en: "Delineation signs guide drivers along the correct path, especially at bends, narrowings, or obstacles. They show the path to follow to avoid danger.",
      ar: "تُرشد علامات التوجيه الطرقي السائق إلى المسار الصحيح، خاصة عند المنعطفات أو التضييقات أو العوائق. وهي توضح المسار الواجب اتباعه لتجنب الخطر.",
      fr: "Les panneaux de balisage guident le conducteur sur le bon trajet, notamment dans les virages, les rétrécissements ou face aux obstacles. Ils indiquent le trajet à suivre pour éviter le danger.",
    },
  },
  Z: {
    title: {
      nl: "Zoneborden",
      en: "Zone Signs",
      ar: "علامات المناطق",
      fr: "Panneaux de zone",
    },
    description: {
      nl: "Zoneborden regelen het verkeer binnen een volledige zone. De aangegeven regel geldt vanaf het binnenrijden en blijft van kracht op de wegen en straten van de zone tot aan het eindezonebord.",
      en: "Zone signs regulate traffic throughout an entire area. The rule shown applies when you enter and remains in force on the roads and streets within the zone until the end-of-zone sign.",
      ar: "تنظّم علامات المناطق حركة السير داخل منطقة كاملة. يبدأ تطبيق القاعدة المبينة عليها عند دخول المنطقة، وتبقى سارية في الطرق والشوارع التابعة لها حتى الوصول إلى علامة نهاية المنطقة.",
      fr: "Les panneaux de zone règlent la circulation dans une zone entière. La règle indiquée s'applique dès l'entrée et reste en vigueur sur les routes et rues de la zone jusqu'au panneau de fin de zone.",
    },
  },
};

export const GROUP_LETTER_ORDER: string[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "FM",
  "G",
  "M",
  "T",
  "Z",
];
