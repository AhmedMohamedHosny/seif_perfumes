import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, getDoc, 
  increment, setDoc, deleteDoc, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* =========================================================
   1. تهيئة مشروع فايربيز الجديد الخاص بـ (سيف للعطور)
   ========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyBpk0UVLAnHsaTZtSTxMfINOHkuAS8OE9Q",
  authDomain: "seif-perfumes.firebaseapp.com",
  projectId: "seif-perfumes",
  storageBucket: "seif-perfumes.firebasestorage.app",
  messagingSenderId: "464823513051",
  appId: "1:464823513051:web:2ef7412e119dac739981fe",
  measurementId: "G-NW3VJW5BBH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const perfumesCol = collection(db, "perfumes");
const ordersCol = collection(db, "orders");
const couponsCol = collection(db, "coupons");
const settingsDoc = doc(db, "settings", "storeConfig");

/* =========================================================
   2. لستة الـ 99 عطراً الكاملة من سيف للعطور مع تصنيف ذكي
   ========================================================= */
const initialCatalog = [
  { id: 1, name: "بكرات روج (Baccarat Rouge)", category: "unisex", price: 420, notes: "عنبر الحوت، ياسمين، زعفران، خشب الأرز", bestseller: true },
  { id: 2, name: "استرونجر وز يو انتنسلي (Stronger With You Intensely)", category: "men", price: 380, notes: "فانيليا دافئة، فلفل وردي، قرفة، عنبر", bestseller: true },
  { id: 3, name: "استرونجر عنبر (Stronger Amber)", category: "men", price: 390, notes: "عنبر ملكي، خشب الغاياك، لافندر ناعم", bestseller: false },
  { id: 4, name: "لومال الكسير (Le Male Elixir)", category: "men", price: 410, notes: "عسل نقي، فانيليا داكنة، حبوب التونكا، لافندر", bestseller: true },
  { id: 5, name: "نوتيكا فوياج (Nautica Voyage)", category: "men", price: 290, notes: "تفاح أخضر، لوتس مائي، خشب الأرز، مسك منعش", bestseller: false },
  { id: 6, name: "لوبو باراديس جاردن (Le Beau Paradise Garden)", category: "men", price: 420, notes: "جوز هند استوائي، زنجبيل، نعناع، أخشاب مالحة", bestseller: true },
  { id: 7, name: "إمبريال فالي قصة (Imperial Valley)", category: "unisex", price: 450, notes: "دافانا، برغموت إيطالي، روزماري، جلد أسود، عنبر", bestseller: true },
  { id: 8, name: "عود وصال (Oud Wisal)", category: "unisex", price: 340, notes: "عود ناعم، مسك أبيض، ورد دمشقي", bestseller: false },
  { id: 9, name: "تو وان تو (212 Sexy / VIP)", category: "men", price: 320, notes: "حمضيات منعشة، زنجبيل، فلفل أسود، نجيل الهند", bestseller: false },
  { id: 10, name: "فانتوم (Phantom Paco Rabanne)", category: "men", price: 360, notes: "لافندر كريمي، ليمون منعش، فانيليا ترابية", bestseller: false },
  { id: 11, name: "دنهل ديزاير (Dunhill Desire)", category: "men", price: 300, notes: "تفاح أحمر، زهر البرتقال، خشب الساج، فانيليا", bestseller: false },
  { id: 12, name: "اسكلبتشر (Sculpture)", category: "men", price: 280, notes: "أزهار البرتقال، برغموت، بنزوين، أرز", bestseller: false },
  { id: 13, name: "خمرة (Khamrah)", category: "unisex", price: 380, notes: "قرفة، تمر حلو، خشب الأرز، جوزة الطيب، فانيليا", bestseller: true },
  { id: 14, name: "خمرة قهوة (Khamrah Qahwa)", category: "unisex", price: 390, notes: "قهوة عربية محمصة، قرفة، هيل، كراميل مدخن", bestseller: true },
  { id: 15, name: "عود مضاوي (Oud Madawi)", category: "unisex", price: 420, notes: "خوخ مجفف، زهر البرتقال، عود فاخر، عنبر ملكي", bestseller: true },
  { id: 16, name: "مضاوي جولد (Madawi Gold)", category: "women", price: 430, notes: "هيل، فواكه استوائية، أناناس، فانيليا نقية", bestseller: false },
  { id: 17, name: "هوجو بوس (Hugo Boss Bottled)", category: "men", price: 310, notes: "تفاح مقرمش، قرفة خشبية، خشب الزيتون", bestseller: false },
  { id: 18, name: "ايماجنيشن لويس فيتون (Imagination)", category: "men", price: 490, notes: "شاي أسود صيني، زهر البرتقال، قرفة ناعمة، أمبروكسان", bestseller: true },
  { id: 19, name: "وان مليون (1 Million)", category: "men", price: 340, notes: "يوسفي، قرفة حارة، جلد فاخر، عنبر دافئ", bestseller: true },
  { id: 20, name: "اكوا دي جيو (Acqua Di Gio)", category: "men", price: 350, notes: "نفحات بحرية، برغموت كالابريا، زهر البرتقال، باتشولي", bestseller: false },
  { id: 21, name: "فلير (Fleur Narcotique)", category: "unisex", price: 440, notes: "ليتشي، خوخ طازج، زهر البرتقال، بيوني، طحلب السنديان", bestseller: true },
  { id: 22, name: "اومبر ليذر (Ombre Leather)", category: "unisex", price: 450, notes: "جلد أسود مدبوغ، هيل فاخر، ياسمين جبلي، باتشولي", bestseller: true },
  { id: 23, name: "بي ام (BM Silver)", category: "men", price: 320, notes: "حمضيات رياضية، خشب الصندل، مسك فضي ناعم", bestseller: false },
  { id: 24, name: "باد بوي (Bad Boy Carolina Herrera)", category: "men", price: 360, notes: "فلفل أسود وأبيض، كاكاو مر، حبوب التونكا، برغموت", bestseller: false },
  { id: 25, name: "انفكتوس (Invictus)", category: "men", price: 330, notes: "جريب فروت، نسيم البحر، ورق لورا، خشب الغاياك", bestseller: false },
  { id: 26, name: "انفكتوس فيكتوري (Invictus Victory)", category: "men", price: 370, notes: "ليمون مثلج، لبان عماني، فانيليا مدخنة، عنبر", bestseller: true },
  { id: 27, name: "اسد لطافة (Asad)", category: "men", price: 340, notes: "فلفل أسود، تبغ دافئ، قهوة داكنة، عنبر وخشب الأرز", bestseller: true },
  { id: 28, name: "كيالي فانيليا (Kayali Vanilla 28)", category: "women", price: 390, notes: "فانيليا مدغشقر، سكر بني، أوركيد الفانيليا، مسك رقيق", bestseller: true },
  { id: 29, name: "سيجار (Cigar Rémy Latour)", category: "men", price: 270, notes: "أوراق التبغ الكلاسيكية، برقوق، جوزة الطيب، صندل", bestseller: false },
  { id: 30, name: "بينك شوجر (Pink Sugar)", category: "women", price: 290, notes: "حلوى غزل البنات، توت العليق، فراولة، فانيليا، كراميل", bestseller: true },
  { id: 31, name: "عود ابيض (White Oud)", category: "unisex", price: 310, notes: "عود هادئ ومخملي، عنبر ناصع، مسك بودري", bestseller: false },
  { id: 32, name: "بوس ذا سنت (Boss The Scent)", category: "men", price: 330, notes: "فاكهة المانينكا الأفريقية، زنجبيل، جلد فاخر", bestseller: false },
  { id: 33, name: "اسكندل رجالي (Scandal Pour Homme)", category: "men", price: 380, notes: "كراميل مكرمل، ميرمية كلاري، حبوب التونكا، نجيل الهند", bestseller: true },
  { id: 34, name: "اسكندل النسائي (Scandal Jean Paul)", category: "women", price: 390, notes: "عسل نقي مسكوب، غردينيا، برتقال دموي، باتشولي", bestseller: true },
  { id: 35, name: "ميجا مار (Megamare Orto Parisi)", category: "unisex", price: 490, notes: "طحالب بحرية مظلمة، يود، ملوحة مياه المحيط العميقة", bestseller: true },
  { id: 36, name: "مونت بلانك لجند مون بلو (Montblanc Legend)", category: "men", price: 320, notes: "خزامى، برغموت، لويزة، تفاح أحمر، خشب الصندل", bestseller: false },
  { id: 37, name: "الوسام الرصاصي (Al Wisam Day)", category: "men", price: 330, notes: "لافندر، ليمون منعش، ورود، خشب الأرز، صندل هادئ", bestseller: false },
  { id: 38, name: "كريد افنتوس (Creed Aventus)", category: "men", price: 460, notes: "أناناس مدخن، برغموت، بتولا، مسك رمادي، تفاح مقرمش", bestseller: true },
  { id: 39, name: "الثائر (Al Thaer)", category: "men", price: 350, notes: "توابل شرقية حارة، جلد مدبوغ، عود كمبودي", bestseller: false },
  { id: 40, name: "بيانكو لاتيه (Bianco Latte Giardini)", category: "women", price: 450, notes: "حليب الفانيليا، كراميل سائل، عسل أبيض، مسك رغوي", bestseller: true },
  { id: 41, name: "عود بوكيه لانكوم (Oud Bouquet)", category: "unisex", price: 430, notes: "عود باريسي فاخر، برالين لوز، بتلات الورد، فانيليا", bestseller: false },
  { id: 42, name: "ميد نايت (Midnight Rose)", category: "women", price: 340, notes: "ورد، توت العليق، كشمش أسود، فلفل وردي، أرز", bestseller: false },
  { id: 43, name: "امير العرب (Ameer Al Arab)", category: "men", price: 320, notes: "هيل، حبوب الهيل، ريحان، شاي أخضر، صندل", bestseller: true },
  { id: 44, name: "اميرة العرب (Ameerat Al Arab)", category: "women", price: 320, notes: "فراولة برية، ياسمين، مسك أبيض، زهور شرقية", bestseller: true },
  { id: 45, name: "جاد أوف فاير (God of Fire)", category: "unisex", price: 490, notes: "مانجو استوائي طازج، زنجبيل أحمر، ليمون، خشب الصندل، عنبر", bestseller: true },
  { id: 46, name: "بلو دي شانيل (Bleu De Chanel)", category: "men", price: 420, notes: "جريب فروت، بخور ناعم، خشب الأرز، زنجبيل، نعناع", bestseller: true },
  { id: 47, name: "احساس (Ehsaas العربية)", category: "unisex", price: 350, notes: "ورد طائفي، عنبر معتق، صندل هندي، خشب الأرز", bestseller: false },
  { id: 48, name: "بلاك ليكسز (Black XS)", category: "men", price: 310, notes: "حلوى البرالين، ليمون كالابريا، هيل أسود، خشب الورد", bestseller: false },
  { id: 49, name: "باسفيك شيل (Pacific Chill LV)", category: "unisex", price: 490, notes: "كشمش أسود، كزبرة، برتقال، ريحان، نعناع، تمر هندي", bestseller: true },
  { id: 50, name: "سلفر سنت (Silver Scent)", category: "men", price: 290, notes: "زهر الليمون، جوزة الطيب، حبوب التونكا، نجيل الهند", bestseller: false },
  { id: 51, name: "برادا بارادوكس (Prada Paradoxe)", category: "women", price: 430, notes: "براعم زهر البرتقال، ليتشي، عنبر حيوي، مسك أبيض نقي", bestseller: true },
  { id: 52, name: "لاكوست وايت (Lacoste White L.12.12)", category: "men", price: 310, notes: "جريب فروت منعش، هيل، مسك الروم، جلد سويدي", bestseller: false },
  { id: 53, name: "لاكوست اسنشال (Lacoste Essential)", category: "men", price: 300, notes: "أوراق الطماطم، كاسيس، حمضيات خضراء، فلفل أسود", bestseller: false },
  { id: 54, name: "شامبيون دافيدوف (Davidoff Champion)", category: "men", price: 290, notes: "برغموت، ليمون، ميرمية خضراء، طحلب السنديان", bestseller: false },
  { id: 55, name: "تراب الدهب (Turab Al Dhahab)", category: "unisex", price: 330, notes: "جوز هند، فانيليا كريمية، أوركيد، لوتس، مسك دافئ", bestseller: false },
  { id: 56, name: "شيروتي 1881 (Cerruti 1881)", category: "men", price: 280, notes: "خزامى كلاسيكي، سرو، قرنفل، خشب الصندل، عنبر", bestseller: false },
  { id: 57, name: "عود شهرة (Shuhrah Pour Homme)", category: "men", price: 340, notes: "أوراق الطماطم، ورد، بخور دخاني، جلد فاخر، عود", bestseller: true },
  { id: 58, name: "جود جيرل (Good Girl Carolina Herrera)", category: "women", price: 390, notes: "لوز محمص، قهوة نقية، مسك الروم، ياسمين سامباك، كاكاو", bestseller: true },
  { id: 59, name: "كول وتر بلو (Cool Water Man)", category: "men", price: 280, notes: "مياه المحيط، نعناع بارد، إكليل الجبل، خشب الصندل", bestseller: false },
  { id: 60, name: "لاف إذ هيفن (Love is Heavenly)", category: "women", price: 310, notes: "زنبق الماء، مسك أبيض، توت بري، فريزيا ناعمة", bestseller: false },
  { id: 61, name: "كليكي فلور عود بخور", category: "unisex", price: 360, notes: "بخور مروكي، زهور دمشقية، دهن عود خالص", bestseller: false },
  { id: 62, name: "يارا كاندي لطافة (Yara Candy)", category: "women", price: 360, notes: "حلوى الكاندي، فراولة مسكرة، فانيليا بودر، مسك لطيف", bestseller: true },
  { id: 63, name: "روز فانيليا مانسيرا (Roses Vanille)", category: "women", price: 410, notes: "سكر ناصع، ورد تركي، فانيليا مركزة، مسك أبيض رقيق", bestseller: true },
  { id: 64, name: "مون اسباركل اسكادا (Moon Sparkle)", category: "women", price: 320, notes: "فراولة حمراء، كشمش أسود، تفاح أحمر، بازلاء حلوة", bestseller: false },
  { id: 65, name: "بربري هير (Burberry Her)", category: "women", price: 410, notes: "توت العليق، كرز حامض، ياسمين، فانيليا، كشمير", bestseller: true },
  { id: 66, name: "كريزي لاف (Crazy Love)", category: "women", price: 290, notes: "كوكتيل فواكه حمراء، زهور بيضاء، فانيليا خفيفة", bestseller: false },
  { id: 67, name: "فري سيكسي ناو (Very Sexy Now)", category: "women", price: 330, notes: "جوز هند استوائي، لوتس، جوز الشيا، مسك حسي", bestseller: false },
  { id: 68, name: "إسكيب كالفن كلاين (Escape For Men)", category: "men", price: 290, notes: "شمام مائي، ميرمية، كافور، خشب الأرز، فيتيفر", bestseller: false },
  { id: 69, name: "هرش لهب (Harsh Lahab)", category: "men", price: 340, notes: "توابل مشتعلة، فلفل حار، عود داكن، جلد", bestseller: false },
  { id: 70, name: "ألف ليلة وليلة (Alf Leila)", category: "unisex", price: 370, notes: "عود مبخر، مسك غزال، زعفران ملكي، عنبر شرقي", bestseller: false },
  { id: 71, name: "رومبا بالنسياجا (Rumba)", category: "women", price: 310, notes: "برقوق، عسل داكن، قرنفل، جلد، خشب الباتشولي", bestseller: false },
  { id: 72, name: "بلو دانهيل (Dunhill Desire Blue)", category: "men", price: 300, notes: "ليتشي، يوسفي، نسيم البحر، خشب الورد البرازيلي", bestseller: false },
  { id: 73, name: "كالفن كلاين ون (CK One)", category: "unisex", price: 290, notes: "ليمون، شاي أخضر، هيل، أناناس، زنبق الوادي، أرز", bestseller: false },
  { id: 74, name: "باي جيفنشي (Pi Givenchy)", category: "men", price: 360, notes: "فانيليا كلاسيكية، لوز، حبوب التونكا، بنزوين مدخن", bestseller: false },
  { id: 75, name: "امير العود (Ameer Al Oud)", category: "unisex", price: 330, notes: "عود بلسمي، سكر مكرمل، فانيليا، مسك داكن", bestseller: false },
  { id: 76, name: "فانيليا باودر ماتيير (Vanilla Powder)", category: "unisex", price: 470, notes: "فانيليا مدغشقر، مسك أبيض قطني، أخشاب البالو سانتو", bestseller: true },
  { id: 77, name: "مسك فراولة (Strawberry Musk)", category: "women", price: 240, notes: "مسك طهارة بارد، فراولة طبيعية نقية، فانيليا", bestseller: true },
  { id: 78, name: "مسك بيلا (Bella Musk)", category: "women", price: 260, notes: "زهور ناعمة، لمسة فاكهية رقيقة، مسك أبيض بودري", bestseller: false },
  { id: 79, name: "مسك مارشميلو (Marshmallow Musk)", category: "women", price: 270, notes: "مارشميلو سكري، سكر مطحون، مسك مخملي ناعم", bestseller: true },
  { id: 80, name: "مسك توت احمر (Red Berry Musk)", category: "unisex", price: 260, notes: "توت أحمر مجمد، ليتشي، مسك منعش صيفي", bestseller: false },
  { id: 81, name: "مسك رمان (Pomegranate Musk)", category: "unisex", price: 260, notes: "عصير الرمان المركز، لمسات زهرية، مسك بلوري", bestseller: true },
  { id: 82, name: "مسك خوخ (Peach Musk)", category: "women", price: 250, notes: "خوخ سكري طازج، مسك حريري، قطرات الندى", bestseller: false },
  { id: 83, name: "مسك فانيليا (Vanilla Musk)", category: "unisex", price: 260, notes: "فانيليا ناعمة كالحليب، مسك أبيض صافٍ", bestseller: true },
  { id: 84, name: "مسك باودر (Powder Musk)", category: "unisex", price: 260, notes: "بودرة أطفال فاخرة، زنبق الوادي، مسك الطهارة النقي", bestseller: true },
  { id: 85, name: "مسك اميرة العرب (Ameerat Musk)", category: "women", price: 270, notes: "مسك طائفي مع قطرات زهور بيضاء وفواكه سكرية", bestseller: false },
  { id: 86, name: "مسك ابيض طهارة (Pure White Musk)", category: "unisex", price: 230, notes: "مسك الطهارة الأصلي الكثيف، نظافة وراحة تدوم", bestseller: true },
  { id: 87, name: "مسك مانجا (Mango Musk)", category: "unisex", price: 260, notes: "مانجو ناضجة، نسيم استوائي، مسك خفيف منعش", bestseller: true },
  { id: 88, name: "مسك احمر (Red Musk)", category: "unisex", price: 260, notes: "قرفة، توابل حارة، مسك شرقي معتق", bestseller: false },
  { id: 89, name: "مارفيل مان (Marvel Man)", category: "men", price: 310, notes: "حمضيات منعشة، أخشاب طازجة، مسك رجالي جريء", bestseller: false },
  { id: 90, name: "بلاتنيوم إيجويست (Egoiste Platinum)", category: "men", price: 380, notes: "إكليل الجبل، لافندر، جيرانيوم، نجيل الهند، أرز", bestseller: false },
  { id: 91, name: "جيمي شو (Jimmy Choo Man)", category: "men", price: 320, notes: "شمام ناضج، فلفل وردي، أوراق الأناناس، باتشولي", bestseller: false },
  { id: 92, name: "دراكر نوار (Drakkar Noir)", category: "men", price: 270, notes: "إكليل الجبل، نعناع، ريحان، خشب الأرز، جلود كلاسيكية", bestseller: false },
  { id: 93, name: "استلر تاميذ (Stellar Times LV)", category: "unisex", price: 490, notes: "عنبر أبيض دافئ، زهر البرتقال، خلاصة الخشب البلسمي", bestseller: true },
  { id: 94, name: "سوفاج ديور (Sauvage Dior)", category: "men", price: 390, notes: "برغموت كالابريا، فلفل سيتشوان، أمبروكسان، خشب الأرز", bestseller: true },
  { id: 95, name: "إربا بورا (Erba Pura Xerjoff)", category: "unisex", price: 460, notes: "برتقال صقلي، ليمون، سلة فواكه البحر الأبيض، مسك أبيض، فانيليا", bestseller: true },
  { id: 96, name: "جي 3 (G3 Fragrance)", category: "men", price: 310, notes: "توابل خشبية، ليمون مالح، أخشاب الغابات", bestseller: false },
  { id: 97, name: "وان مان شو (One Man Show)", category: "men", price: 260, notes: "صنوبر، خشب الورد، طحالب السنديان، جلود داكنة", bestseller: false },
  { id: 98, name: "تيد لابيدوس (Ted Lapidus)", category: "men", price: 270, notes: "أناناس، عسل، تبغ، خشب الصندل، بخور", bestseller: false },
  { id: 99, name: "كنزو بور هوم (Kenzo Pour Homme)", category: "men", price: 320, notes: "أمواج البحر المندفعة، صنوبر، جوزة الطيب، خشب الصندل", bestseller: false }
];

/* =========================================================
   3. حالة التطبيق والمخازن المحلية (State Management)
   ========================================================= */
let products = [...initialCatalog];
let cart = loadLocal("seif_cart", []);
let wishlist = loadLocal("seif_wishlist", []);
let currentCategory = "all";
let searchQuery = "";
let currentSort = "featured";
let currentPage = 1;
const PRODUCTS_PER_PAGE = 12;

let currentPfpProduct = null;
let currentPfpSize = 50;
let currentPfpQty = 1;

let activeCoupon = null;
let adminWhatsappNumber = "201016118242";

// نسب تسعير الأحجام (إذا لم يُحدد سعر خاص في لوحة التحكم)
const SIZE_MULTIPLIERS = {
  30: 0.65,
  50: 1.00,
  100: 1.70
};

/* =========================================================
   4. دوال المساعدة والتسعير الدقيق
   ========================================================= */
function saveLocal(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

function loadLocal(key, defaultVal) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  const d = document.createElement("div");
  d.textContent = String(str);
  return d.innerHTML;
}

function formatPrice(num) {
  return `${Number(num || 0).toLocaleString("ar-EG")} ج`;
}

// السعر الدقيق للحجم من الفايربيز أو النسبة
function getProductExactPrice(prod, size = 50) {
  if (!prod) return 0;
  const sz = Number(size);
  if (prod.sizes && prod.sizes[sz] !== undefined && prod.sizes[sz] !== null && Number(prod.sizes[sz]) > 0) {
    return Number(prod.sizes[sz]);
  }
  const base = Number(prod.price || 300);
  return Math.round((base * (SIZE_MULTIPLIERS[sz] || 1)) / 10) * 10;
}

// المخزون الفعلي للحجم المختار
function getProductExactStock(prod, size = 50) {
  if (!prod) return 0;
  const sz = Number(size);
  if (prod.stocks && prod.stocks[sz] !== undefined && prod.stocks[sz] !== null) {
    return Number(prod.stocks[sz]);
  }
  return prod.stock !== undefined ? Number(prod.stock) : 15;
}

/* =========================================================
   5. توليد كروت العطور الملمومة (Compact Grid Cards)
   ========================================================= */
function generateProductCardHtml(p) {
  const isFav = wishlist.some(id => String(id) === String(p.id));
  const price30 = getProductExactPrice(p, 30);
  const price50 = getProductExactPrice(p, 50);

  // الفئة المكتوبة
  const catLabel = p.category === "men" ? "رجالي" : p.category === "women" ? "نسائي" : "للجنسين";
  const catBadgeClass = p.category === "women" ? "badge-pink" : p.category === "men" ? "badge-blue" : "badge-gold";

  return `
    <article class="compact-perfume-card" data-id="${p.id}">
      
      <!-- الصورة وأزرار التفاعل السريعة -->
      <div class="card-visual-wrap" onclick="openProductFullPage('${p.id}')">
        ${p.bestseller ? '<span class="card-star-badge">الأكثر مبيعاً 🔥</span>' : ''}
        
        <button type="button" 
                class="card-fav-btn ${isFav ? 'active' : ''}" 
                data-action="wishlist" 
                data-id="${p.id}" 
                title="إضافة للمفضلة">
          ${isFav ? '♥' : '♡'}
        </button>

        <img src="${p.image || 'image/S1.png'}" alt="${escapeHtml(p.name)}" class="card-perfume-img" loading="lazy">
        
        <span class="card-view-pill">معاينة وتفاصيل 👁️</span>
      </div>

      <!-- معلومات العطر المدمجة -->
      <div class="card-data-wrap">
        <div class="card-category-row">
          <span class="compact-cat-badge ${catBadgeClass}">${catLabel}</span>
          <span class="card-sim-tag">محاكاة الأصلية ✦</span>
        </div>

        <h3 class="card-perfume-name" onclick="openProductFullPage('${p.id}')">${escapeHtml(p.name)}</h3>
        
        <p class="card-notes-brief">${escapeHtml(p.notes || "توليفة عطرية مركزة وثابتة تدوم طويلاً")}</p>

        <!-- سطر السعر والطلب السريع الملموم -->
        <div class="card-action-footer">
          <div class="card-price-stack">
            <span class="price-from-txt">يبدأ من (30مل):</span>
            <strong class="card-price-val">${formatPrice(price30)}</strong>
          </div>

          <button type="button" 
                  class="card-quick-buy-btn" 
                  data-action="quick-buy" 
                  data-id="${p.id}" 
                  title="شراء العبوة الأساسية (50 مل) فوراً">
            <span>شراء ⚡</span>
          </button>
        </div>

      </div>

    </article>
  `;
}

/* =========================================================
   6. الفلترة المتقدمة (تشمل إظهار للجنسين في الاثنين)
   ========================================================= */
function getFilteredCatalog() {
  let list = [...products];

  // 1. الفئة
  if (currentCategory !== "all") {
    if (currentCategory === "bestseller") {
      list = list.filter(p => p.bestseller === true);
    } else if (currentCategory === "wishlist") {
      list = list.filter(p => wishlist.map(String).includes(String(p.id)));
    } else if (currentCategory === "men") {
      // يظهر عطور الرجال + أي عطر صُنف للجنسين تلقائياً
      list = list.filter(p => p.category === "men" || p.category === "unisex");
    } else if (currentCategory === "women") {
      // يظهر عطور النساء + أي عطر صُنف للجنسين تلقائياً
      list = list.filter(p => p.category === "women" || p.category === "unisex");
    } else if (currentCategory === "unisex") {
      list = list.filter(p => p.category === "unisex");
    }
  }

  // 2. البحث الحي
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(p => 
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.desc && p.desc.toLowerCase().includes(q))
    );
  }

  // 3. الترتيب
  switch (currentSort) {
    case "price-low":
      list.sort((a, b) => getProductExactPrice(a, 50) - getProductExactPrice(b, 50));
      break;
    case "price-high":
      list.sort((a, b) => getProductExactPrice(b, 50) - getProductExactPrice(a, 50));
      break;
    case "name":
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    default:
      list.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
  }

  return list;
}

function renderCatalog() {
  const grid = document.getElementById("productsGrid");
  const noProds = document.getElementById("noProducts");
  const womenBanner = document.getElementById("womenNoticeBanner");

  if (womenBanner) {
    womenBanner.style.display = (currentCategory === "women") ? "block" : "none";
  }

  const list = getFilteredCatalog();
  const totalPages = Math.ceil(list.length / PRODUCTS_PER_PAGE);

  if (currentPage > totalPages && totalPages > 0) currentPage = 1;

  const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const paginated = list.slice(start, start + PRODUCTS_PER_PAGE);

  if (grid) {
    grid.innerHTML = paginated.map(generateProductCardHtml).join("");
  }

  if (list.length === 0) {
    if (noProds) noProds.style.display = "block";
    renderPagination(0);
  } else {
    if (noProds) noProds.style.display = "none";
    renderPagination(totalPages);
  }
}

function renderPagination(totalPages) {
  const container = document.getElementById("pagination");
  if (!container) return;

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  for (let i = 1; i <= totalPages; i++) {
    html += `<button type="button" class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  container.innerHTML = html;
  container.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentPage = Number(btn.dataset.page);
      renderCatalog();
      document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
    });
  });
}

window.filterByQuick = function(cat) {
  currentCategory = cat;
  currentPage = 1;
  document.querySelectorAll(".capsule-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.category === cat);
  });
  renderCatalog();
  document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" });
};

window.resetFilters = function() {
  currentCategory = "all";
  searchQuery = "";
  const input = document.getElementById("globalSearchInput");
  if (input) input.value = "";
  filterByQuick("all");
};

/* =========================================================
   7. صفحة تفاصيل العطر المستقلة الكاملة (Product Full Page)
   ========================================================= */
const productFullPage = document.getElementById("productFullPage");
const pfpImage = document.getElementById("pfpImage");
const pfpCategory = document.getElementById("pfpCategory");
const pfpName = document.getElementById("pfpName");
const pfpNotesSummary = document.getElementById("pfpNotesSummary");
const pfpDesc = document.getElementById("pfpDesc");
const pfpFinalPrice = document.getElementById("pfpFinalPrice");
const pfpQtyVal = document.getElementById("pfpQtyVal");
const pfpStockPill = document.getElementById("pfpStockPill");
const pfpAddBtn = document.getElementById("pfpAddBtn");
const pfpBuyNowBtn = document.getElementById("pfpBuyNowBtn");
const pfpWomenNotice = document.getElementById("pfpWomenNotice");

window.openProductFullPage = function(id) {
  const prod = products.find(p => String(p.id) === String(id));
  if (!prod || !productFullPage) return;

  currentPfpProduct = prod;
  currentPfpSize = 50; // الحجم الأساسي
  currentPfpQty = 1;

  if (pfpImage) pfpImage.src = prod.image || "image/S1.png";
  if (pfpName) pfpName.textContent = prod.name;
  if (pfpNotesSummary) pfpNotesSummary.textContent = prod.notes || "عطر فاخر يحاكي الأصلي بدقة وثبات";
  if (pfpDesc) pfpDesc.textContent = prod.desc || "تم تصنيع وتركيب هذا العطر باستخدام أنقى الزيوت العطرية الفرنسية لضمان تطابق تام مع الماركة الأصلية، وثبات يتخطى الـ 48 ساعة.";

  if (pfpCategory) {
    pfpCategory.textContent = prod.category === "men" ? "رجالي" : prod.category === "women" ? "نسائي" : "للجنسين";
  }

  if (pfpWomenNotice) {
    pfpWomenNotice.style.display = (prod.category === "women") ? "block" : "none";
  }

  // تنشيط زر الحجم 50 مل
  document.querySelectorAll("#pfpSizesGroup .size-choice-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.size === "50");
  });

  updatePfpInterface();
  renderRelatedPerfumes(prod);

  productFullPage.style.setProperty("display", "block", "important");
  document.body.classList.add("no-scroll");
  productFullPage.scrollTop = 0;
};

window.closeProductFullPage = function() {
  if (productFullPage) {
    productFullPage.style.display = "none";
    document.body.classList.remove("no-scroll");
    currentPfpProduct = null;
  }
};

document.getElementById("closeProductPageBtn")?.addEventListener("click", closeProductFullPage);

// اختيار الحجم
document.getElementById("pfpSizesGroup")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".size-choice-btn");
  if (!btn || !currentPfpProduct) return;

  document.querySelectorAll("#pfpSizesGroup .size-choice-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  currentPfpSize = Number(btn.dataset.size);
  const maxAvail = getProductExactStock(currentPfpProduct, currentPfpSize);
  currentPfpQty = maxAvail > 0 ? 1 : 0;
  
  updatePfpInterface();
});

// أزرار الكمية
document.getElementById("pfpQtyMinus")?.addEventListener("click", () => {
  if (currentPfpQty > 1) {
    currentPfpQty--;
    updatePfpInterface();
  }
});

document.getElementById("pfpQtyPlus")?.addEventListener("click", () => {
  if (!currentPfpProduct) return;
  const maxAvail = getProductExactStock(currentPfpProduct, currentPfpSize);

  if (currentPfpQty >= maxAvail) {
    showToast("أقصى كمية متاحة", `المتوفر بالمخزون من حجم (${currentPfpSize} مل) هو ${maxAvail} زجاجات فقط ⚠️`);
    return;
  }

  currentPfpQty++;
  updatePfpInterface();
});

function updatePfpInterface() {
  if (!currentPfpProduct) return;

  const unitPrice = getProductExactPrice(currentPfpProduct, currentPfpSize);
  const totalPrice = unitPrice * Math.max(1, currentPfpQty);
  const availableStock = getProductExactStock(currentPfpProduct, currentPfpSize);

  if (pfpFinalPrice) pfpFinalPrice.textContent = formatPrice(totalPrice);
  if (pfpQtyVal) pfpQtyVal.textContent = currentPfpQty;

  if (pfpStockPill) {
    if (availableStock <= 0) {
      pfpStockPill.textContent = "نفدت الكمية من هذا الحجم ❌";
      pfpStockPill.style.color = "#e74c3c";
    } else {
      pfpStockPill.textContent = `المتوفر من حجم (${currentPfpSize} مل): ${availableStock} زجاجات فقط`;
      pfpStockPill.style.color = "var(--accent-gold)";
    }
  }

  // قفل الأزرار عند نفاد المخزون
  const isOutOfStock = availableStock <= 0;
  if (pfpAddBtn) {
    pfpAddBtn.disabled = isOutOfStock;
    pfpAddBtn.style.opacity = isOutOfStock ? "0.45" : "1";
    pfpAddBtn.innerHTML = isOutOfStock ? '<span>❌</span><span>نفدت الكمية</span>' : '<span>🛒</span><span>أضف إلى السلة</span>';
  }
  if (pfpBuyNowBtn) {
    pfpBuyNowBtn.disabled = isOutOfStock;
    pfpBuyNowBtn.style.opacity = isOutOfStock ? "0.45" : "1";
  }
}

// زر الإضافة للسلة
pfpAddBtn?.addEventListener("click", () => {
  if (!currentPfpProduct) return;
  addToCart(currentPfpProduct.id, currentPfpQty, currentPfpSize);
  showToast("تمت الإضافة بنجاح 🛍️", `${currentPfpProduct.name} (${currentPfpSize} مل)`);
});

// زر الشراء الفوري (ينقل المشتري مباشرة لإتمام الطلب بنفس الحجم والكمية)
pfpBuyNowBtn?.addEventListener("click", () => {
  if (!currentPfpProduct) return;
  addToCart(currentPfpProduct.id, currentPfpQty, currentPfpSize);
  closeProductFullPage();
  openCheckout();
});

// عطور مماثلة متطابقة تماماً مع كروت المتجر
function renderRelatedPerfumes(mainProduct) {
  const grid = document.getElementById("pfpRelatedGrid");
  if (!grid) return;

  let related = products.filter(p => p.category === mainProduct.category && String(p.id) !== String(mainProduct.id));
  if (related.length === 0) {
    related = products.filter(p => String(p.id) !== String(mainProduct.id));
  }

  const selected = related.slice(0, 4);
  grid.innerHTML = selected.map(generateProductCardHtml).join("");
}

/* =========================================================
   8. صفحة السلة المستقلة الكاملة (Full Cart Page)
   ========================================================= */
const cartFullPage = document.getElementById("cartFullPage");

window.openCart = function() {
  closeProductFullPage();
  closeCheckout();
  updateCartInterface();
  if (cartFullPage) {
    cartFullPage.style.setProperty("display", "block", "important");
    document.body.classList.add("no-scroll");
    cartFullPage.scrollTop = 0;
  }
};

window.closeCart = function() {
  if (cartFullPage) {
    cartFullPage.style.display = "none";
    document.body.classList.remove("no-scroll");
  }
};

document.getElementById("closeCartPageBtn")?.addEventListener("click", closeCart);
document.getElementById("cartHeaderBtn")?.addEventListener("click", openCart);

function addToCart(id, qty = 1, size = 50) {
  const prod = products.find(p => String(p.id) === String(id));
  if (!prod) return;

  const sz = Number(size);
  const maxStock = getProductExactStock(prod, sz);
  if (maxStock <= 0) {
    showToast("نفدت الكمية", `عذراً، حجم (${sz} مل) غير متوفر حالياً ❌`);
    return;
  }

  const existing = cart.find(i => String(i.id) === String(id) && Number(i.size) === sz);

  if (existing) {
    if (existing.quantity + qty > maxStock) {
      existing.quantity = maxStock;
      showToast("المخزون المتاح", `الكمية المتاحة هي ${maxStock} فقط وتم ضبطها في سلتك ⚠️`);
    } else {
      existing.quantity += qty;
    }
  } else {
    cart.push({
      id: prod.id,
      size: sz,
      quantity: Math.min(qty, maxStock)
    });
  }

  saveLocal("seif_cart", cart);
  updateBadges();
}

function updateCartInterface() {
  const listEl = document.getElementById("cartItemsList");
  const subtotalEl = document.getElementById("cartSubtotalAmount");
  const finalEl = document.getElementById("cartFinalAmount");
  const giftsEl = document.getElementById("cartGiftsAmount");
  const discountRow = document.getElementById("cartDiscountRow");
  const discountVal = document.getElementById("cartDiscountAmount");

  if (!listEl) return;

  if (cart.length === 0) {
    listEl.innerHTML = `
      <div class="cart-empty-panel">
        <div class="empty-icon">🛒</div>
        <h3>سلة مشترياتك فارغة حالياً</h3>
        <p>استكشف كتالوج سيف واختر عطرك المفضل لتحصل على تستر 5 مل هدية مجانية مع كل زجاجة.</p>
        <button type="button" class="btn-primary-glow" onclick="closeCart(); document.getElementById('catalog').scrollIntoView({behavior:'smooth'});">تصفح العطور الآن</button>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = "0 ج";
    if (finalEl) finalEl.textContent = "0 ج";
    if (giftsEl) giftsEl.textContent = "0 تسترات هدية";
    return;
  }

  let subtotal = 0;
  let totalBottles = 0;

  listEl.innerHTML = cart.map(item => {
    const prod = products.find(p => String(p.id) === String(item.id));
    if (!prod) return "";

    const sz = Number(item.size || 50);
    const unitPrice = getProductExactPrice(prod, sz);
    const itemTotal = unitPrice * item.quantity;
    const maxStock = getProductExactStock(prod, sz);

    subtotal += itemTotal;
    totalBottles += Number(item.quantity || 1);

    return `
      <div class="cart-item-card">
        <img src="${prod.image || 'image/S1.png'}" alt="${escapeHtml(prod.name)}" class="cart-item-img">
        
        <div class="cart-item-details">
          <div class="item-title-row">
            <h4>${escapeHtml(prod.name)}</h4>
            <button type="button" class="btn-remove-item" onclick="removeCartItem('${prod.id}', ${sz})">&times;</button>
          </div>

          <span class="cart-item-size-badge">حجم العبوة: <strong>${sz} مل</strong></span>
          <span class="cart-item-gift-tag">🎁 يشمل تستر 5 مل مجاناً مع هذه الزجاجة</span>

          <div class="cart-item-bottom-row">
            <div class="cart-qty-picker">
              <button type="button" onclick="modifyCartQty('${prod.id}', ${sz}, -1)">−</button>
              <span>${item.quantity}</span>
              <button type="button" onclick="modifyCartQty('${prod.id}', ${sz}, 1)">+</button>
            </div>
            
            <div class="cart-price-sum">
              <span class="unit-p">سعر القطعة: ${formatPrice(unitPrice)}</span>
              <strong class="total-p">${formatPrice(itemTotal)}</strong>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  // حساب الخصم
  let discount = 0;
  if (activeCoupon) {
    if (activeCoupon.type === "percent") {
      discount = Math.round(subtotal * (activeCoupon.value / 100));
    }
  }

  const finalTotal = Math.max(0, subtotal - discount);

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (finalEl) finalEl.textContent = formatPrice(finalTotal);
  if (giftsEl) giftsEl.textContent = `${totalBottles} تسترات (5 مل مجاناً) 🎁`;

  if (discountRow && discountVal) {
    if (discount > 0) {
      discountRow.style.display = "flex";
      discountVal.textContent = `- ${formatPrice(discount)}`;
    } else {
      discountRow.style.display = "none";
    }
  }
}

window.modifyCartQty = function(id, size, change) {
  const item = cart.find(i => String(i.id) === String(id) && Number(i.size) === Number(size));
  if (!item) return;

  const prod = products.find(p => String(p.id) === String(id));
  const maxStock = getProductExactStock(prod, size);

  if (change > 0 && item.quantity + change > maxStock) {
    showToast("المخزون المتاح", `المتبقي من هذا الحجم بالمخزن هو ${maxStock} فقط ⚠️`);
    return;
  }

  item.quantity += change;
  if (item.quantity <= 0) {
    removeCartItem(id, size);
    return;
  }

  saveLocal("seif_cart", cart);
  updateBadges();
  updateCartInterface();
};

window.removeCartItem = function(id, size) {
  cart = cart.filter(i => !(String(i.id) === String(id) && Number(i.size) === Number(size)));
  saveLocal("seif_cart", cart);
  updateBadges();
  updateCartInterface();
  showToast("تم الحذف", "تمت إزالة العطر من السلة.");
};

document.getElementById("proceedCheckoutBtn")?.addEventListener("click", () => {
  if (cart.length === 0) {
    showToast("السلة فارغة", "أضف عطوراً أولاً للمتابعة.");
    return;
  }
  closeCart();
  openCheckout();
});

/* =========================================================
   9. صفحة إتمام الطلب والدفع المستقلة (Checkout Full Page)
      مع الحفظ التلقائي للبيانات وحساب التسترات في الفاتورة
   ========================================================= */
const checkoutFullPage = document.getElementById("checkoutFullPage");
const custGovSelect = document.getElementById("custGov");
const checkoutOrderForm = document.getElementById("checkoutOrderForm");

let GOVERNORATES = [
  { name: "القاهرة", fee: 45 }, { name: "الجيزة", fee: 45 }, { name: "الإسكندرية", fee: 55 },
  { name: "القليوبية", fee: 50 }, { name: "الغربية", fee: 55 }, { name: "المنوفية", fee: 55 },
  { name: "الشرقية", fee: 55 }, { name: "الدقهلية", fee: 55 }, { name: "البحيرة", fee: 60 },
  { name: "كفر الشيخ", fee: 60 }, { name: "دمياط", fee: 60 }, { name: "بورسعيد", fee: 60 },
  { name: "الإسماعيلية", fee: 60 }, { name: "السويس", fee: 60 }, { name: "الفيوم", fee: 65 },
  { name: "بني سويف", fee: 70 }, { name: "المنيا", fee: 75 }, { name: "أسيوط", fee: 80 },
  { name: "سوهاج", fee: 85 }, { name: "قنا", fee: 90 }, { name: "الأقصر", fee: 95 },
  { name: "أسوان", fee: 95 }, { name: "البحر الأحمر", fee: 100 }, { name: "مطروح", fee: 90 },
  { name: "الوادي الجديد", fee: 100 }, { name: "شمال سيناء", fee: 110 }, { name: "جنوب سيناء", fee: 110 }
];

function populateGovs() {
  if (!custGovSelect) return;
  const curr = custGovSelect.value;
  custGovSelect.innerHTML = '<option value="" disabled selected>اختر المحافظة لحساب تكلفة الشحن بدقة</option>';
  GOVERNORATES.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.name;
    opt.textContent = `${g.name} (${g.fee} ج)`;
    if (g.name === curr) opt.selected = true;
    custGovSelect.appendChild(opt);
  });
}
populateGovs();

window.openCheckout = function() {
  if (cart.length === 0) {
    showToast("السلة فارغة", "أضف عطوراً أولاً لإتمام الشراء.");
    return;
  }
  closeProductFullPage();
  closeCart();
  populateGovs();
  autoFillCustomerData();
  updateCheckoutReview();

  if (checkoutFullPage) {
    checkoutFullPage.style.setProperty("display", "block", "important");
    document.body.classList.add("no-scroll");
    checkoutFullPage.scrollTop = 0;
  }
};

window.closeCheckout = function() {
  if (checkoutFullPage) {
    checkoutFullPage.style.display = "none";
    document.body.classList.remove("no-scroll");
  }
};

document.getElementById("closeCheckoutPageBtn")?.addEventListener("click", () => {
  closeCheckout();
  openCart();
});

// الحفظ التلقائي للبيانات في المتصفح (Auto-Save & Auto-Fill)
function autoFillCustomerData() {
  const saved = loadLocal("seif_customer_data", null);
  if (!saved) return;
  if (saved.name) document.getElementById("custName").value = saved.name;
  if (saved.phone) document.getElementById("custPhone").value = saved.phone;
  if (saved.phone2) document.getElementById("custPhone2").value = saved.phone2;
  if (saved.gov && custGovSelect) {
    custGovSelect.value = saved.gov;
  }
  if (saved.address) document.getElementById("custAddress").value = saved.address;
}

["custName", "custPhone", "custPhone2", "custGov", "custAddress"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", () => {
    saveLocal("seif_customer_data", {
      name: document.getElementById("custName")?.value.trim(),
      phone: document.getElementById("custPhone")?.value.trim(),
      phone2: document.getElementById("custPhone2")?.value.trim(),
      gov: document.getElementById("custGov")?.value,
      address: document.getElementById("custAddress")?.value.trim()
    });
    updateCheckoutReview();
  });
});

custGovSelect?.addEventListener("change", updateCheckoutReview);

function getShippingCost(subtotal) {
  if (subtotal >= 1500) return 0; // شحن مجاني
  const selGov = GOVERNORATES.find(g => g.name === custGovSelect?.value);
  return selGov ? selGov.fee : 0;
}

function updateCheckoutReview() {
  const previewList = document.getElementById("checkoutOrderItemsList");
  const subtotalEl = document.getElementById("checkoutSubtotal");
  const shippingEl = document.getElementById("checkoutShippingVal");
  const grandEl = document.getElementById("checkoutGrandTotal");
  const giftsEl = document.getElementById("checkoutGiftsVal");
  const discountRow = document.getElementById("checkoutDiscountLine");
  const discountVal = document.getElementById("checkoutDiscountVal");

  let subtotal = 0;
  let totalBottles = 0;

  if (previewList) {
    previewList.innerHTML = cart.map(item => {
      const prod = products.find(p => String(p.id) === String(item.id));
      if (!prod) return "";
      const sz = Number(item.size || 50);
      const uPrice = getProductExactPrice(prod, sz);
      const total = uPrice * item.quantity;
      subtotal += total;
      totalBottles += Number(item.quantity || 1);

      return `
        <div class="preview-item-row">
          <div class="name-sz">
            <strong>${escapeHtml(prod.name)}</strong>
            <span>عبوة ${sz} مل × ${item.quantity}</span>
          </div>
          <span class="price-val">${formatPrice(total)}</span>
        </div>
      `;
    }).join("");
  }

  let discount = 0;
  if (activeCoupon && activeCoupon.type === "percent") {
    discount = Math.round(subtotal * (activeCoupon.value / 100));
  }

  const shipping = getShippingCost(subtotal);
  const grandTotal = Math.max(0, subtotal - discount) + shipping;

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (giftsEl) giftsEl.textContent = `${totalBottles} عينات تستر (5 مل مجاناً) 🎁`;

  if (shippingEl) {
    if (!custGovSelect?.value) {
      shippingEl.textContent = "حدد المحافظة";
      shippingEl.style.color = "var(--text-muted)";
    } else if (subtotal >= 1500) {
      shippingEl.textContent = "مجاني (طلب أكثر من 1500 ج) 🔥";
      shippingEl.style.color = "#2ecc71";
    } else {
      shippingEl.textContent = `${shipping} ج`;
      shippingEl.style.color = "var(--text-light)";
    }
  }

  if (discountRow && discountVal) {
    if (discount > 0) {
      discountRow.style.display = "flex";
      discountVal.textContent = `- ${formatPrice(discount)}`;
    } else {
      discountRow.style.display = "none";
    }
  }

  if (grandEl) grandEl.textContent = formatPrice(grandTotal);
}

// تبديل خيارات الدفع
document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
  radio.addEventListener("change", (e) => {
    const box = document.getElementById("walletTransferBox");
    if (box) {
      box.style.display = (e.target.value === "vodafone_cash" || e.target.value === "instapay") ? "block" : "none";
    }
  });
});

document.getElementById("copyWalletBtn")?.addEventListener("click", () => {
  const num = document.getElementById("seifWalletNumber")?.textContent || "01016118242";
  navigator.clipboard.writeText(num).then(() => {
    showToast("تم النسخ بنجاح 📋", `تم نسخ رقم التحويل: ${num}`);
  });
});

// تحديد الموقع التلقائي (GPS)
document.getElementById("btnLocationGps")?.addEventListener("click", () => {
  const status = document.getElementById("locationGpsStatus");
  const hiddenLink = document.getElementById("custLocationMapLink");

  if (!navigator.geolocation) {
    if (status) status.textContent = "المتصفح لا يدعم تحديد الموقع التلقائي.";
    return;
  }

  if (status) {
    status.textContent = "جاري التقاط إحداثيات موقعك عبر الأقمار الصناعية... ⏳";
    status.style.color = "var(--accent-gold)";
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      if (hiddenLink) hiddenLink.value = link;
      if (status) {
        status.textContent = "✓ تم التقاط موقعك الجغرافي بنجاح وسيرفق مع البوليصة.";
        status.style.color = "#2ecc71";
      }
    },
    () => {
      if (status) {
        status.textContent = "تعذر تحديد الموقع، يرجى كتابة تفاصيل العنوان يدوياً.";
        status.style.color = "#e74c3c";
      }
    },
    { enableHighAccuracy: true, timeout: 8000 }
  );
});

// إرسال وتأكيد الطلب النهائي
checkoutOrderForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("custName").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const phone2 = document.getElementById("custPhone2").value.trim();
  const gov = custGovSelect.value;
  const address = document.getElementById("custAddress").value.trim();
  const mapLink = document.getElementById("custLocationMapLink").value;
  const payMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || "cod";

  if (!/^01[0125][0-9]{8}$/.test(phone)) {
    alert("رقم الهاتف الأساسي غير صحيح! يجب أن يتكون من 11 رقماً ويبدأ بـ (010 أو 011 أو 012 أو 015).");
    return;
  }

  if (phone2 && !/^01[0125][0-9]{8}$/.test(phone2)) {
    alert("رقم الهاتف البديل غير صحيح! يجب أن يتكون من 11 رقماً.");
    return;
  }

  if (!gov) {
    alert("يرجى اختيار المحافظة لحساب قيمة الشحن والتوصيل.");
    return;
  }

  const submitBtn = document.getElementById("confirmOrderBtn");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = "<span>جاري تأكيد الطلب وحجز الشحنة... ⏳</span>";
  }

  let subtotal = 0;
  let totalBottles = 0;
  const orderItemsData = cart.map(item => {
    const prod = products.find(p => String(p.id) === String(item.id));
    const sz = Number(item.size || 50);
    const uPrice = getProductExactPrice(prod, sz);
    const itemTotal = uPrice * item.quantity;
    subtotal += itemTotal;
    totalBottles += Number(item.quantity || 1);

    return {
      id: prod ? prod.id : item.id,
      name: prod ? prod.name : "عطر",
      size: `${sz} مل`,
      quantity: item.quantity,
      price: uPrice,
      total: itemTotal
    };
  });

  const shipping = getShippingCost(subtotal);
  let discount = 0;
  if (activeCoupon && activeCoupon.type === "percent") {
    discount = Math.round(subtotal * (activeCoupon.value / 100));
  }
  const grandTotal = Math.max(0, subtotal - discount) + shipping;

  const payNames = {
    cod: "الدفع عند الاستلام كاش (COD) 💵",
    vodafone_cash: "فودافون كاش (Vodafone Cash) 📱",
    instapay: "انستا باي (InstaPay) ⚡"
  };

  const itemsListText = orderItemsData.map(i => `• ${i.name} (${i.size}) × ${i.quantity} — بسعر ${i.total} ج`).join("\n");
  const freeTesterGiftsText = `🎁 *الهدايا المرفقة المجانية:* عدد (${totalBottles}) تستر 5 مل هدية مجاناً مع كل زجاجة من اختيارك.`;

  const waInvoiceMessage = `*طلب شراء جديد — سيف للعطور (SEIF PERFUMES)* 💎
━━━━━━━━━━━━━━━━━━
👤 *بيانات المستلم:*
• الاسم: ${name}
• الهاتف الأساسي: ${phone}
• الهاتف البديل: ${phone2 || "لا يوجد"}
• المحافظة: ${gov}
• العنوان بالتفصيل: ${address}
• موقع الخريطة: ${mapLink || "لم يُحدد"}

📦 *المنتجات المطلوبة:*
${itemsListText}

${freeTesterGiftsText}
━━━━━━━━━━━━━━━━━━
💰 *الحساب والتكاليف:*
• المجموع الفرعي: ${subtotal} جنيه
${discount > 0 ? `• قيمة الخصم: -${discount} جنيه\n` : ''}• مصاريف التوصيل: ${shipping === 0 ? 'مجاني 🔥' : `${shipping} جنيه`}
• *المبلغ الإجمالي المطلوب تحصيله:* *${grandTotal} جنيه*
• طريقة الدفع: ${payNames[payMethod]}
━━━━━━━━━━━━━━━━━━
✨ تم تأكيد وتسجيل الطلب عبر متجر سيف للعطور`;

  try {
    // 1. تسجيل الطلب في فايرستور
    const orderDoc = await addDoc(ordersCol, {
      customer: {
        name,
        phone,
        secondaryPhone: phone2 || "غير محدد",
        governorate: gov,
        address,
        googleMapsUrl: mapLink || "لم يحدد موقع GPS"
      },
      items: orderItemsData,
      pricing: { subtotal, discount, shippingFee: shipping, total: grandTotal },
      paymentMethod: payMethod,
      whatsappMessage: waInvoiceMessage,
      status: "new",
      createdAt: new Date()
    });

    // 2. تحديث مخزون الأحجام تلقائياً
    for (const item of cart) {
      try {
        const prodRef = doc(db, "perfumes", String(item.id));
        const sz = Number(item.size || 50);
        await updateDoc(prodRef, {
          [`stocks.${sz}`]: increment(-Number(item.quantity || 1)),
          stock: increment(-Number(item.quantity || 1))
        });
      } catch (stkErr) {
        console.warn("Stock update skipped for:", item.id);
      }
    }

    // 3. مسح السلة وإغلاق الشاشة
    cart = [];
    saveLocal("seif_cart", cart);
    updateBadges();
    closeCheckout();
    checkoutOrderForm.reset();

    showToast("تم تأكيد طلبك بنجاح! 🎉", "جاري توجيهك إلى واتساب لإرسال الفاتورة...");

    const waUrl = `https://wa.me/${adminWhatsappNumber}?text=${encodeURIComponent(waInvoiceMessage)}`;
    setTimeout(() => {
      window.open(waUrl, "_blank");
    }, 1200);

  } catch (err) {
    console.error("Order submit error:", err);
    alert("حدث خطأ أثناء إرسال الطلب، تأكد من اتصال الإنترنت وحاول مجدداً.");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = "<span>تأكيد الطلب الآن ➔</span>";
    }
  }
});

/* =========================================================
   10. المفضلة والبحث والإشعارات والشريط
   ========================================================= */
function updateBadges() {
  const cartBadge = document.getElementById("cartCountBadge");
  const wishBadge = document.getElementById("wishlistCountBadge");

  const totalCartCount = cart.reduce((sum, i) => sum + Number(i.quantity || 1), 0);
  if (cartBadge) cartBadge.textContent = totalCartCount;
  if (wishBadge) wishBadge.textContent = wishlist.length;
}

function toggleWishlist(id) {
  const strId = String(id);
  const exists = wishlist.some(i => String(i) === strId);

  if (exists) {
    wishlist = wishlist.filter(i => String(i) !== strId);
    showToast("المفضلة", "تمت إزالة العطر من المفضلة.");
  } else {
    wishlist.push(id);
    showToast("المفضلة ♥", "تمت إضافة العطر إلى قائمة أمنياتك.");
  }

  saveLocal("seif_wishlist", wishlist);
  updateBadges();
  renderCatalog();
}

document.getElementById("wishlistHeaderBtn")?.addEventListener("click", () => {
  filterByQuick("wishlist");
});

// تتبع النقرات العامة في الصفحة
document.addEventListener("click", (e) => {
  const favBtn = e.target.closest('[data-action="wishlist"]');
  if (favBtn) {
    e.stopPropagation();
    toggleWishlist(favBtn.dataset.id);
    return;
  }

  const quickBuyBtn = e.target.closest('[data-action="quick-buy"]');
  if (quickBuyBtn) {
    e.stopPropagation();
    const id = quickBuyBtn.dataset.id;
    addToCart(id, 1, 50); // الحجم القياسي 50 مل
    openCheckout();
    return;
  }
});

// شريط البحث المنسدل
const searchDrawer = document.getElementById("searchDrawer");
const searchInput = document.getElementById("globalSearchInput");

document.getElementById("searchToggleBtn")?.addEventListener("click", () => {
  if (searchDrawer) {
    searchDrawer.classList.toggle("open");
    if (searchDrawer.classList.contains("open")) {
      setTimeout(() => searchInput?.focus(), 200);
    }
  }
});

document.getElementById("searchCloseBtn")?.addEventListener("click", () => {
  if (searchDrawer) searchDrawer.classList.remove("open");
});

searchInput?.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  currentPage = 1;
  renderCatalog();
});

// كبسولات الفئات والترتيب
document.getElementById("categoryTabs")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".capsule-btn");
  if (!btn) return;
  document.querySelectorAll(".capsule-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentCategory = btn.dataset.category;
  currentPage = 1;
  renderCatalog();
});

document.getElementById("sortSelect")?.addEventListener("change", (e) => {
  currentSort = e.target.value;
  currentPage = 1;
  renderCatalog();
});

// شريط الإشعارات المؤقت (Toast)
let toastTimer = null;
function showToast(title, msg) {
  const toast = document.getElementById("toast");
  const tTitle = document.getElementById("toastTitle");
  const tText = document.getElementById("toastText");
  if (!toast) return;

  if (tTitle) tTitle.textContent = title;
  if (tText) tText.textContent = msg;

  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// كوبون الخصم في السلة
document.getElementById("applyCouponBtn")?.addEventListener("click", async () => {
  const inp = document.getElementById("couponCodeInput");
  const msg = document.getElementById("couponStatusMsg");
  const code = inp ? inp.value.trim().toUpperCase() : "";

  if (!msg) return;
  if (!code) {
    msg.style.display = "block";
    msg.style.color = "#e74c3c";
    msg.textContent = "يرجى إدخال كود الكوبون أولاً!";
    return;
  }

  try {
    const snap = await getDoc(doc(db, "coupons", code));
    if (snap.exists() && snap.data().active) {
      const data = snap.data();
      activeCoupon = data;
      msg.style.display = "block";
      msg.style.color = "#2ecc71";
      msg.textContent = `✓ تم تطبيق خصم (${data.value}%) بنجاح!`;
      updateCartInterface();
    } else {
      activeCoupon = null;
      msg.style.display = "block";
      msg.style.color = "#e74c3c";
      msg.textContent = "عذراً، هذا الكود غير صالح أو منتهي!";
      updateCartInterface();
    }
  } catch (err) {
    msg.style.display = "block";
    msg.style.color = "#e74c3c";
    msg.textContent = "تعذر فحص الكوبون، حاول مجدداً.";
  }
});

/* =========================================================
   11. المزامنة الحية مع فايربيز (Firestore Sync)
   ========================================================= */
onSnapshot(perfumesCol, (snapshot) => {
  if (!snapshot.empty) {
    const firebaseList = [];
    snapshot.forEach(d => {
      const data = d.data();
      firebaseList.push({
        id: d.id,
        name: data.name,
        category: data.category || "unisex",
        price: Number(data.price || 300),
        oldPrice: data.oldPrice ? Number(data.oldPrice) : null,
        sizes: data.sizes || null,
        stocks: data.stocks || null,
        stock: data.stock !== undefined ? Number(data.stock) : 15,
        bestseller: data.bestseller === true,
        desc: data.desc || "",
        notes: data.notes || data.desc || "توليفة عطرية مركزة ومحاكاة دقيقة للأصلية",
        image: data.image || "image/S1.png"
      });
    });

    if (firebaseList.length > 0) {
      products = firebaseList;
      renderCatalog();
    }
  }
});

// جلب إعدادات المتجر العامة (رقم الواتساب)
onSnapshot(settingsDoc, (snap) => {
  if (snap.exists()) {
    const d = snap.data();
    if (d.whatsappNumber) {
      let clean = String(d.whatsappNumber).replace(/\D/g, "");
      if (clean.startsWith("0")) clean = "2" + clean;
      adminWhatsappNumber = clean;
    }
  }
});

// تشغيل الواجهة
updateBadges();
renderCatalog();
