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
      nl: "Waarschuwingsborden hebben wereldwijd, en vooral in Europa, een uniform ontwerp dat direct herkenbaar is. Ze zijn gebaseerd op drie essentiële elementen: een driehoekige vorm met een punt naar boven, een brede rode rand op witte achtergrond voor maximale zichtbaarheid, en een eenvoudig zwart symbool dat de aard van het gevaar weergeeft.",
      en: "Warning signs worldwide, especially in Europe, have a uniform design that is instantly recognizable. They are based on three essential elements: a triangular shape pointing upward, a wide red border on a white background for maximum visibility, and a simple black symbol that clearly depicts the nature of the hazard.",
      ar: "تتميز العلامات التحذيرية في معظم دول العالم وأوروبا بتصميم موحد يسهل التعرف عليه فوراً، حيث يعتمد على ثلاثة عناصر أساسية: الشكل المثلث الذي تتجه إحدى زواياه إلى الأعلى، إطار أحمر عريض على خلفية بيضاء لأقصى وضوح، ورمز أسود بسيط يصور طبيعة الخطر.",
      fr: "Les panneaux d'avertissement ont un design uniforme immédiatement reconnaissable, basé sur trois éléments essentiels : une forme triangulaire pointant vers le haut, une large bordure rouge sur fond blanc pour une visibilité maximale, et un symbole noir simple illustrant clairement la nature du danger.",
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
      nl: "Voorrangsborden behoren tot de belangrijkste elementen van verkeersregulering. Ze bepalen wie voorrang heeft bij kruispunten en smalle doorgangen. Deze borden spelen een essentiële rol bij het verminderen van ongevallen door haast of verkeerde inschattingen, vooral op plaatsen zonder verkeerslichten.",
      en: "Priority signs are among the most important elements of traffic regulation. They determine who has the right of way at intersections and narrow passages. These signs play an essential role in reducing accidents caused by rushing or misjudgment, especially in places without traffic lights.",
      ar: "تعد علامات الأولوية من أهم عناصر تنظيم حركة السير، حيث تحدد من له حق المرور عند التقاطعات والممرات الضيقة. تلعب هذه العلامات دوراً جوهرياً في تقليل الحوادث الناتجة عن التسرع أو سوء التقدير، لا سيما في الأماكن التي تفتقر إلى إشارات المرور الضوئية.",
      fr: "Les panneaux de priorité comptent parmi les éléments les plus importants de la régulation du trafic. Ils déterminent qui a la priorité aux intersections et passages étroits. Ces panneaux jouent un rôle essentiel dans la réduction des accidents causés par la précipitation ou une mauvaise évaluation, surtout aux endroits sans feux de circulation.",
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
      nl: "Verbodsborden zijn verkeersborden die duidelijke beperkingen opleggen aan bepaald gedrag of aan specifieke voertuigtypes op bepaalde plaatsen en onder bepaalde omstandigheden. Deze borden geven niet alleen richting, maar leggen een verplichting op die moet worden nageleefd om gevaar of chaos te voorkomen.",
      en: "Prohibition signs are traffic signs that impose clear restrictions on certain behaviors or on specific types of vehicles in certain places and circumstances. These signs do not only provide guidance but impose a mandatory order that must be followed to avoid danger or chaos.",
      ar: "علامات المنع هي إشارات مرورية تفرض قيوداً واضحة على سلوكيات معينة أو على أنواع محددة من المركبات في أماكن وظروف معينة. هذه العلامات لا تقدم توجيهاً فحسب، بل تفرض أمراً واجب التنفيذ لتفادي الخطر أو الفوضى.",
      fr: "Les panneaux d'interdiction sont des panneaux qui imposent des restrictions claires sur certains comportements ou sur des types spécifiques de véhicules dans certains endroits et circonstances. Ces panneaux ne fournissent pas seulement des indications, mais imposent un ordre obligatoire qui doit être respecté pour éviter le danger ou le chaos.",
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
      nl: "Gebodsborden zijn verkeersborden die bestuurders en weggebruikers verplichten een bepaald gedrag of een specifieke richting te volgen. Deze borden bieden geen keuze, maar zijn directe bevelen die onmiddellijk moeten worden uitgevoerd om een vlotte doorstroming van het verkeer te garanderen en de verkeersveiligheid te verbeteren.",
      en: "Mandatory signs are traffic signs that require drivers and road users to follow a specific behavior or direction. These signs do not offer a choice, but represent direct orders that must be executed immediately to ensure smooth traffic flow and enhance road safety.",
      ar: "العلامات الإجبارية هي إشارات مرورية تُلزم السائقين ومستخدمي الطريق باتباع سلوك أو اتجاه محدد. لا تمنح هذه العلامات خياراً، بل تمثل أوامر مباشرة يجب تنفيذها فوراً لضمان انسيابية حركة السير وتعزيز السلامة على الطرق.",
      fr: "Les panneaux d'obligation sont des panneaux qui obligent les conducteurs et les usagers de la route à suivre un comportement ou une direction spécifique. Ces panneaux n'offrent pas de choix, mais représentent des ordres directs qui doivent être exécutés immédiatement pour assurer la fluidité du trafic et améliorer la sécurité routière.",
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
      nl: "Parkeer- en stilstaanborden worden gebruikt om de plaatsen en tijden te regelen waar voertuigen mogen stoppen of parkeren aan de kant van de weg. Deze borden zijn essentieel om verkeerschaos te voorkomen en een vlotte doorstroming te garanderen, vooral in drukke stedelijke gebieden.",
      en: "Parking and standing signs are used to regulate the places and times where vehicles are allowed to stop or park on the side of the road. These signs are essential to prevent traffic chaos and ensure smooth flow, especially in busy urban areas.",
      ar: "تُستخدم علامات الوقوف والتوقف لتنظيم الأماكن والأوقات التي يُسمح فيها للمركبات بالتوقف أو الوقوف على جانب الطريق. تعد هذه العلامات ضرورية لمنع الفوضى المرورية وضمان انسيابية الحركة، خصوصاً في المناطق الحضرية المزدحمة.",
      fr: "Les panneaux de stationnement et d'arrêt sont utilisés pour réglementer les endroits et les moments où les véhicules sont autorisés à s'arrêter ou à stationner sur le côté de la route. Ces panneaux sont essentiels pour prévenir le chaos routier et assurer une circulation fluide, surtout dans les zones urbaines très fréquentées.",
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
      nl: "Aanwijzingsborden worden gebruikt om weggebruikers te begeleiden en te voorzien van belangrijke informatie over bestemmingen of nabijgelegen diensten. Niet alle borden hebben een verplichtend karakter, maar sommige borden vereisen wel dat de aanwijzing in het midden van het verkeersbord wordt opgevolgd.",
      en: "Information signs are used to guide road users and provide them with important information about destinations or nearby services. Not all signs have a mandatory nature, but some require that the instruction shown in the center of the sign be followed.",
      ar: "تُستخدم العلامات الإرشادية لتوجيه مستخدمي الطريق وتزويدهم بمعلومات هامة تتعلق بالوجهات أو الخدمات القريبة. لا تحمل كل العلامات طابعاً إلزامياً، لكن بعضها يجب الالتزام بالأمر المرسوم في وسطها.",
      fr: "Les panneaux d'indication sont utilisés pour guider les usagers de la route et leur fournir des informations importantes sur les destinations ou les services à proximité. Tous les panneaux n'ont pas un caractère obligatoire, mais certains exigent que l'instruction indiquée au centre soit respectée.",
    },
  },
  FM: {
    displayKey: "F",
    title: {
      nl: "Wegmarkering",
      en: "Road Marking Signs",
      ar: "علامات تعليمات الطريق",
      fr: "Panneaux de marquage routier",
    },
    description: {
      nl: "Wegmarkeringsborden duiden tijdelijke verkeersmaatregelen aan op de rijbaan, zoals rijstrookversmalling, rijstrookverlegging en omleidingen. Ze worden voornamelijk gebruikt bij wegenwerken om de rijstrookverdeling aan te passen en de veiligheid van werknemers en weggebruikers te garanderen.",
      en: "Road marking signs indicate temporary traffic measures on the carriageway, such as lane narrowing, lane deviation and detours. They are primarily used during roadworks to adjust the lane layout and guarantee the safety of workers and road users.",
      ar: "علامات تعليمات الطريق تشير إلى تدابير المرور المؤقتة على مسار السير، كتضيق المسارات وتحويلها واللتفافات. وتُستخدم بصفة رئيسية أثناء أعمال البناء لتعديل توزيع المسارات وضمان سلامة العمال ومستخدمي الطريق.",
      fr: "Les panneaux de marquage routier indiquent des mesures de circulation temporaires sur la chaussée, comme le rétrécissement ou la déviation de voie et les détournements. Ils sont principalement utilisés lors de travaux routiers pour adapter la répartition des voies et garantir la sécurité des travailleurs et des usagers.",
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
      nl: "Onderborden zijn informatiepanelen die nooit alleen staan, maar altijd onder een hoofdbord worden geplaatst, zoals waarschuwings-, verbods- of gebodsborden. Hun functie is om de betekenis van het hoofdbord te specificeren of te verduidelijken, of de toepassing ervan te beperken tot bepaalde situaties.",
      en: "Supplementary signs are information panels that never appear alone, but are always placed below a main sign such as warning, prohibition, or mandatory signs. Their function is to specify or clarify the meaning of the main sign, or restrict its application to certain situations.",
      ar: "العلامات التكميلية هي لوحات إرشادية لا تأتي منفردة، بل توضع دائماً أسفل علامة رئيسية من علامات التحذير أو المنع أو الإجبار. وظيفتها تحديد أو توضيح معنى العلامة الرئيسية، أو تقييد تطبيقها على حالات معينة.",
      fr: "Les panneaux complémentaires sont des panneaux d'information qui n'apparaissent jamais seuls, mais sont toujours placés sous un panneau principal tel qu'un panneau d'avertissement, d'interdiction ou d'obligation. Leur fonction est de préciser ou de clarifier la signification du panneau principal, ou d'en restreindre l'application à certaines situations.",
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
      nl: "Deze onderborden geven specifieke aanvullende informatie voor fietsers, bromfietsers, speed pedelecs en andere lichte weggebruikers. Ze worden altijd onder een hoofdbord geplaatst en verduidelijken hoe dat bord van toepassing is op deze groepen.",
      en: "These supplementary panels provide specific additional information for cyclists, moped riders, speed pedelecs and other light road users. They are always placed below a main sign and clarify how that sign applies to these groups.",
      ar: "هذه اللوحات التكميلية تقدم معلومات إضافية محددة لراكبي الدراجات والدراجات البخارية والدراجات الكهربائية وغيرهم من مستخدمي الطريق الخفيفين. توضع دائماً أسفل علامة رئيسية وتوضح كيفية تطبيقها على هذه الفئات.",
      fr: "Ces panneaux complémentaires fournissent des informations supplémentaires spécifiques pour les cyclistes, les conducteurs de cyclomoteurs, les speed pedelecs et autres usagers légers. Ils sont toujours placés sous un panneau principal et précisent comment ce panneau s'applique à ces groupes.",
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
      nl: "Afbakeningsborden worden gebruikt om de bestuurder naar het juiste pad te leiden, vooral bij bochten, wegversmallingen of obstakels. Deze borden leggen geen verkeersregel op zoals snelheid of voorrang, maar tonen duidelijk de weg die moet worden gevolgd om gevaar te vermijden.",
      en: "Delineation signs are used to guide the driver to the correct path, especially at curves, narrowings, or obstacles. These signs do not impose a traffic rule like speed or priority, but clearly show the path that must be followed to avoid danger.",
      ar: "علامات التوجيه الطرقي تُستعمل لإرشاد السائق إلى المسار الصحيح، خاصة عند المنعطفات والتضييقات أو وجود عوائق. لا تفرض هذه العلامات قاعدة مرورية كالسرعة أو الأولوية، لكنها تُظهر بوضوح الطريق الواجب اتباعه لتفادي الخطر.",
      fr: "Les panneaux de balisage sont utilisés pour guider le conducteur vers le bon chemin, notamment dans les virages, les rétrécissements ou face aux obstacles. Ces panneaux n'imposent pas de règle de circulation comme la vitesse ou la priorité, mais montrent clairement le chemin à suivre pour éviter le danger.",
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
      nl: "Zoneborden worden gebruikt om het verkeer in een hele zone te reguleren. De aangegeven verkeersregel wordt van kracht zodra je de zone binnenrijdt en blijft geldig op alle wegen en straten binnen de zone, inclusief zijstraten en kruispunten, totdat je het einde-zonebord bereikt.",
      en: "Zone signs are used to regulate traffic in an entire area. The indicated traffic rule applies as soon as you enter the zone and remains valid on all roads and streets within the zone, including side streets and intersections, until you reach the end-of-zone sign.",
      ar: "علامات المناطق المرورية تُستعمل لتنظيم حركة السير داخل منطقة كاملة. تُطبَّق القاعدة المرورية المبيّنة عليها فور دخول المنطقة وتبقى سارية على جميع الطرق والشوارع التابعة لها، بما في ذلك الشوارع الجانبية والتقاطعات، ولا تنتهي إلا عند الوصول إلى علامة نهاية المنطقة.",
      fr: "Les panneaux de zone sont utilisés pour réguler la circulation dans une zone entière. La règle de circulation indiquée s'applique dès l'entrée dans la zone et reste valable sur toutes les routes et rues de la zone, y compris les rues latérales et les intersections, jusqu'au panneau de fin de zone.",
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
