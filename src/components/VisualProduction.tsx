import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flow } from 'flow-sdk';
import { PillButton, SectionLabel, TextInput, SegmentedToggle, RangeSlider, FieldDropdown } from './UIPrimitives';
import { JobStatus, AspectRatio } from '../App';

type SourceMode = 'auto' | 'upload'; 

const IMAGE_MODELS = ['🍌 Nano Banana Pro', '🍌 Nano Banana 2', 'Imagen 4'];

// ACCESSORIES DATA - LOCALIZED TO VIETNAMESE
const ACCESSORIES_CATEGORIES = [
  {
    id: 'head',
    label: '👑 Vùng Đầu & Mặt',
    items: [
      { id: 'sunglasses', label: 'Kính râm / Kính mát' },
      { id: 'glasses', label: 'Kính cận / Kính thời trang' },
      { id: 'cap', label: 'Mũ lưỡi trai' },
      { id: 'beanie', label: 'Mũ len' },
      { id: 'bucket_hat', label: 'Mũ tai bèo (Bucket)' },
      { id: 'fedora', label: 'Mũ Fedora' },
      { id: 'earrings', label: 'Bông tai / Hoa tai' },
      { id: 'headband', label: 'Băng đô' },
      { id: 'hairpin', label: 'Kẹp tóc' }
    ]
  },
  {
    id: 'neck',
    label: '👔 Vùng Cổ & Ngực',
    items: [
      { id: 'necklace', label: 'Vòng cổ' },
      { id: 'chain', label: 'Dây chuyền dạng xích' },
      { id: 'choker', label: 'Vòng Choker' },
      { id: 'tie', label: 'Cà vạt' },
      { id: 'bowtie', label: 'Nơ đeo cổ' },
      { id: 'scarf', label: 'Khăn quàng cổ' }
    ]
  },
  {
    id: 'arms',
    label: '🦾 Vùng Tay & Cổ tay',
    items: [
      { id: 'watch', label: 'Đồng hồ kim' },
      { id: 'smartwatch', label: 'Đồng hồ thông minh' },
      { id: 'bracelet', label: 'Vòng tay' },
      { id: 'bangle', label: 'Vòng kiềng' },
      { id: 'rings', label: 'Nhẫn' },
      { id: 'stacked_rings', label: 'Bộ nhẫn' },
      { id: 'gloves', label: 'Găng tay' }
    ]
  },
  {
    id: 'body',
    label: '💼 Vùng Thân & Eo',
    items: [
      { id: 'handbag', label: 'Túi xách tay' },
      { id: 'tote_bag', label: 'Túi vải (Tote)' },
      { id: 'clutch', label: 'Ví cầm tay (Clutch)' },
      { id: 'crossbody_bag', label: 'Túi đeo chéo' },
      { id: 'backpack', label: 'Balo' },
      { id: 'suitcase', label: 'Vali' },
      { id: 'belt', label: 'Thắt lưng da' },
      { id: 'chain_belt', label: 'Thắt lưng xích' }
    ]
  },
  {
    id: 'feet',
    label: '👟 Vùng Chân',
    items: [
      { id: 'sneakers', label: 'Giày thể thao (Sneaker)' },
      { id: 'high_heels', label: 'Giày cao gót' },
      { id: 'boots', label: 'Giày bốt (Boots)' },
      { id: 'loafers', label: 'Giày lười (Loafers)' },
      { id: 'sandals', label: 'Dép quai hậu (Sandals)' },
      { id: 'socks', label: 'Tất / Vớ cao cổ' },
      { id: 'fishnet_stockings', label: 'Tất lưới' }
    ]
  }
];

// HUB IDEAS DATA
const HUB_IDEAS = {
  newborn: {
    label: "Sơ sinh & Trẻ nhỏ (0.5 - 5 tuổi)",
    both: [
      "Mũm mĩm", "Gầy", "Tóc xoăn", "Tóc thẳng", "Má hồng", "Đang cười", "Đang khóc",
      "Đùi ếch", "Đầu trọc", "Lúm đồng tiền", "Mắt tròn to", "Đang bò", "Cười sún răng"
    ]
  },
  children: {
    label: "Nhi đồng (5 - 13 tuổi)",
    both: [
      "Cao", "Thấp", "Mũm mĩm", "Mảnh khảnh", "Tóc dài", "Tóc ngắn", "Tóc đuôi ngựa", "Năng động", "Hiền lành",
      "Tàn nhang", "Tóc tết", "Tóc bát úp", "Sún răng", "Dáng thể thao", "Đeo kính"
    ]
  },
  teens: {
    label: "Vị thành niên (13 - 18 tuổi)",
    male: [
      "Cơ bắp", "Gầy", "Cao", "Da sạch", "Undercut", "Tóc xù",
      "Vai rộng", "Niềng răng", "Tóc Mullet", "Da rám nắng", "Ria mép", "Lêu khêu"
    ],
    female: [
      "Mảnh mai", "Đầy đặn", "Tóc thẳng dài", "Tóc Bob", "Tóc mái ngố",
      "Wolf cut", "Niềng răng", "Da trắng", "Buộc tóc cao", "Chân dài", "Lúm đồng tiền"
    ]
  },
  adults: {
    label: "Thanh niên & Trung niên (18 - 40 tuổi)",
    male: [
      "To lớn", "Vạm vỡ", "Sáu múi", "Mảnh khảnh", "Tóc dài", "Tóc ngắn", "Tóc húi cua", "Có râu", "Cạo sạch", "Có hình xăm", "Không hình xăm",
      "Dáng chữ V", "Cơ bụng", "Ria mép", "Fade haircut", "Gân tay", "Quai hàm sắc cạnh"
    ],
    female: [
      "Đầy đặn", "Plus-size", "Gầy", "Mảnh mai", "Tóc xoăn dài", "Pixie cut", "Da rám nắng", "Da trắng",
      "Dáng đồng hồ cát", "Cơ bụng", "Tóc nhuộm", "Xương quai xanh", "Tàn nhang", "Da căng bóng"
    ]
  },
  mature: {
    label: "Trung niên cao cấp (40 - 55 tuổi)",
    male: [
      "Đậm người", "Cân đối", "Tóc muối tiêu", "Hói nhẹ", "Ria mép",
      "Dad bod", "Râu quai nón", "Tóc vuốt ngược", "Đeo kính", "Phong trần", "Tóc mai"
    ],
    female: [
      "Đầy đặn", "Mảnh mai quý phái", "Tóc ngang vai", "Tóc uốn",
      "Dáng đồng hồ cát", "Tóc tém", "Tóc highlight", "Trẻ trung", "Vết chân chim quý phái", "Dáng điệu cao sang"
    ]
  },
  seniors: {
    label: "Lão niên (> 55 tuổi)",
    both: [
      "To lớn", "Gầy yếu", "Mảnh khảnh", "Tóc trắng", "Hói", "Râu dài", "Đầy đặn", "Nhỏ nhắn", "Tóc bạc", "Tóc búi",
      "Mặt nhăn", "Dáng hơi khom", "Nếp nhăn trí tuệ", "Mắt hiền", "Cầm gậy", "Má hồng lão niên"
    ]
  }
};

const AGE_SPECIFIC_MALE_STYLES: Record<string, { id: string, label: string, prompt: string }[]> = {
  kids: [
    { id: 'dang_yeu', label: 'Bé trai Đáng yêu', prompt: 'Innocent toddler, round chubby face, big sparkling eyes, rosy smooth skin, sweet angelic smile, soft fine hair.' },
    { id: 'thông_minh', label: 'Bé trai Thông minh', prompt: 'Smart young student, wearing stylish glasses, curious expression, neat haircut, bright intellectual gaze, slender build.' },
    { id: 'nang_dong', label: 'Bé trai Năng động', prompt: 'Energetic young boy, messy active hair, tanned skin from playing, wide laughing mouth, athletic small build, mischievous eyes.' },
    { id: 'han_quoc', label: 'Style Hàn Quốc nhí', prompt: 'Korean idol kid style, monolid charming eyes, bowl cut silky hair, very fair porcelain skin, fashionable soft features.' },
    { id: 'nghich_ngom', label: 'Nghịch ngợm', prompt: 'Mischievous troublemaker, funny face expression, one eyebrow raised, energetic posture, scruffy but cute appearance.' },
    { id: 'thanh_lich_nhi', label: 'Thanh lịch nhí', prompt: 'Little gentleman, serious composed face, combed back hair, refined features, dignified small posture.' },
    { id: 'sanh_dieu', label: 'Sành điệu', prompt: 'Mini fashionista, cool trendy haircut, confident model-like gaze, sharp but youthful facial structure.' },
    { id: 'hien_lanh', label: 'Hiền lành', prompt: 'Gentle shy boy, soft gaze, calm small smile, rounded friendly facial features, peaceful aura.' },
    { id: 'kham_pha', label: 'Nhà khám phá', prompt: 'Adventurous young boy, focused determined eyes, dirty cheeks from play, brave posture, outdoorsy vibe.' },
    { id: 'nghe_thuat', label: 'Nghệ thuật nhí', prompt: 'Dreamy artistic kid, longish soft hair, thoughtful expression, sensitive facial features, creative soul look.' },
    { id: 'dang_yeu_2', label: 'Thiên thần nhỏ', prompt: 'Cherubic face, glowing skin, very soft features, incredibly cute and gentle, high-key bright lighting.' },
    { id: 'the_thao_nhi', label: 'Vận động viên nhí', prompt: 'Active sports kid, sweaty forehead, determined competitive gaze, strong sturdy build for his age.' },
  ],
  teens: [
    { id: 'hoc_duong', label: 'Hot boy Học đường', prompt: 'Youthful handsome student, clean-cut jawline, fresh smooth skin, friendly "boy next door" smile, neat schoolboy hair.' },
    { id: 'k-pop', label: 'K-Pop Style', prompt: 'Idol trainee aesthetic, V-shaped sharp face, dyed trendy hair, flawless pale skin, intense charismatic gaze, slender fashionable build.' },
    { id: 'the_thao_teen', label: 'Thể thao năng động', prompt: 'Athletic teenager, sun-kissed skin, messy hair, confident wide smile, developing muscular shoulders, energetic posture.' },
    { id: 'nghe_si', label: 'Nghệ sĩ trẻ', prompt: 'Moody young artist, slightly long hair, brooding deep eyes, pale complexion, expressive slender hands, indie aesthetic.' },
    { id: 'street_teen', label: 'Streetwear Teen', prompt: 'Urban teen rebel, sharp eyes, trendy undercut hair, cool indifferent expression, lean street-dancer build.' },
    { id: 'lan_lung', label: 'Lạnh lùng', prompt: 'Stoic handsome teen, hooded sharp eyes, expressionless cool face, very defined facial structure, aloof mysterious aura.' },
    { id: 'vibrant', label: 'Tươi trẻ', prompt: 'Cheerful Gen-Z boy, radiant skin, big dimpled smile, messy curly hair, approachable and high energy.' },
    { id: 'nerdy', label: 'Mọt sách cá tính', prompt: 'Intellectual chic teen, thick frames, smart gaze, very clean skin, organized sophisticated look.' },
    { id: 'gaming', label: 'Gamer', prompt: 'Tech-savvy teen, cool modern headset, focused gaming eyes, pale "indoor" skin, relaxed casual posture.' },
    { id: 'minimalist', label: 'Tối giản', prompt: 'Aesthetic minimalist boy, soft lighting, clean symmetrical face, neutral calm expression, zen fashion vibe.' },
    { id: 'badboy_teen', label: 'Bad boy nhẹ', prompt: 'Edgy teenager, smirk expression, sharp piercing gaze, slight attitude, rebellious messy hair.' },
    { id: 'shounen', label: 'Anime Protagonist', prompt: 'Live-action shounen hero, big expressive eyes, dynamic wind-blown hair, determined "never give up" smile.' },
  ],
  adults: [
    { id: 'phong_tran', label: 'Phong trần', prompt: 'Ruggedly handsome, light stubble beard, tanned weathered skin, intense soulful eyes, messy wind-blown hair, charismatic masculine build.' },
    { id: 'lan_lung_quý_ông', label: 'Lạnh lùng Qúy ông', prompt: 'Ice-cold handsome man, sharp predatory gaze, perfectly groomed stubble, pale polished skin, stoic authoritative face, lean tailored build.' },
    { id: 'duong_pho', label: 'Cá tính Đường phố', prompt: 'Edgy urban man, sharp facial features, trendy hairstyle, tanned skin, confident smirk, lean-muscular dancer physique.' },
    { id: 'gymer', label: 'Gymer Sắc nét', prompt: 'Hyper-muscular fitness model, massive shoulders, shredded vascular physique, square heavy jawline, short military hair, intense aggressive focus.' },
    { id: 'cong_tu', label: 'Hot boy Công tử', prompt: 'Elite rich boy look, soft refined features, flawless porcelain skin, elegant groomed hair, arrogant but handsome gaze, slender expensive posture.' },
    { id: 'lang_tu', label: 'Lãng tử', prompt: 'Poetic romantic man, wavy medium-length hair, soft melancholic eyes, pale skin, sensitive jawline, mysterious wanderer aura.' },
    { id: 'thanh_lich', label: 'Hot boy Thanh lịch', prompt: 'Modern refined man, clean-shaven, symmetrical handsome face, radiant healthy skin, warm professional smile, well-built classic frame.' },
    { id: 'the_thao', label: 'Thể thao Hot boy', prompt: 'Active outdoorsy man, short sporty hair, athletic V-taper build, sweaty glowing skin, energetic victorious expression.' },
    { id: 'noi_loan', label: 'Cá tính Nổi loạn', prompt: 'Alt-style man, sharp rebellious eyes, edgy undercut, pale skin, confident defiant posture, unconventional handsome features.' },
    { id: 'cong_so', label: 'Lạnh lùng Công sở', prompt: 'Sharp corporate professional, clean-cut appearance, cold calculating gaze, rigid posture, perfectly groomed short hair.' },
    { id: 'than_thien', label: 'Thân thiện hiền lành', prompt: 'Warm approachable man, soft eyes, wide genuine smile, friendly rounded face, trustworthy and kind aura.' },
    { id: 'quy_ong', label: 'Quý ông lịch lãm', prompt: 'Sophisticated gentleman, sharp tailored look, mature confident gaze, clean-shaven or goatee, authoritative presence.' },
  ],
  mature: [
    { id: 'ceo', label: 'CEO Thành đạt', prompt: 'Powerful mature CEO, authoritative gaze, sharp expensive haircut, very confident posture, groomed short beard, commanding presence.' },
    { id: 'quy_ong_mature', label: 'Quý ông Phong độ', prompt: 'Dashing silver fox, fit mature body, sharp facial structure, elegant salt-and-pepper hair, charismatic smile, sophisticated aura.' },
    { id: 'tri_thuc', label: 'Trí thức', prompt: 'Wise mature intellectual, refined features, wearing smart glasses, calm deep gaze, dignified composed posture.' },
    { id: 'sporty_mature', label: 'Thể thao trung niên', prompt: 'Fit mature athlete, tanned muscular build, short active hair, energetic outdoor glow, healthy and strong appearance.' },
    { id: 'phong_tran_mature', label: 'Phong trần lịch lãm', prompt: 'Mature rugged traveler, thick groomed beard, charismatic wrinkles, deep experienced eyes, adventurous masculine vibe.' },
    { id: 'nghe_si_mature', label: 'Nghệ sĩ tài hoa', prompt: 'Mature visionary artist, artistic hair, thoughtful expressive face, sophisticated bohemian style, creative deep soul.' },
    { id: 'gia_dinh', label: 'Người cha ấm áp', prompt: 'Friendly father figure, warm radiant smile, approachable features, kind and reliable gaze, comfortable posture.' },
    { id: 'co_dien', label: 'Cổ điển', prompt: 'Timeless mature elegance, heritage look, traditional sharp grooming, formal dignified face structure.' },
    { id: 'minimal_mature', label: 'Tối giản sang trọng', prompt: 'Quiet luxury mature man, clean minimal grooming, serene face, very refined and expensive simple look.' },
    { id: 'giang_vien', label: 'Giảng viên ưu tú', prompt: 'Distinguished professor, scholarly appearance, wise eyes, authoritative but kind posture, academic aesthetic.' },
    { id: 'bac_si', label: 'Bác sĩ tận tâm', prompt: 'Mature medical professional, trustworthy clean-cut look, focused compassionate gaze, steady posture.' },
    { id: 'nha_khoa_hoc', label: 'Nhà khoa học', prompt: 'Focused mature innovator, intellectual intensity, slightly messy brilliant look, determined sharp eyes.' },
  ],
  seniors: [
    { id: 'tien_boi', label: 'Tiền bối Đáng kính', prompt: 'Honorable elder, wise sparkling eyes, kind wrinkles, silver white hair, graceful and respected posture.' },
    { id: 'lao_nien_quy_phai', label: 'Lão niên Quý phải', prompt: 'Aristocratic senior, noble facial features, perfectly groomed white beard, historical Hub grace, quắc thước presence.' },
    { id: 'am_ap', label: 'Người ông ấm áp', prompt: 'Gentle grandfather, beaming warm smile, soft friendly eyes, radiant peaceful aura, loving expression.' },
    { id: 'nghe_si_lao', label: 'Nghệ sĩ lão thành', prompt: 'Legendary senior artist, long white hair, creative visionary eyes, expressive weathered hands, sophisticated bohemian vibe.' },
    { id: 'tri_thuc_lao', label: 'Nhà thông thái', prompt: 'Ancient scholar, very deep intelligent eyes, long white beard, reading posture, aura of infinite wisdom.' },
    { id: 'sporty_senior', label: 'Lão niên năng động', prompt: 'Healthy fit senior, sun-kissed glowing skin, active posture, short white hair, strong and vital appearance.' },
    { id: 'co_dien_lao', label: 'Phong cách cổ điển', prompt: 'Vintage style elder, classic grooming, sharp heritage look, dignified old-world gentleman features.' },
    { id: 'zen', label: 'Lão nhân Tự tại', prompt: 'Peaceful zen master, meditative expression, calm eyes, very simple and serene facial structure.' },
    { id: 'than_thien_lao', label: 'Thân thiện', prompt: 'Kind elderly neighbor, approachable smiling face, sparkling warm eyes, welcoming posture.' },
    { id: 'nha_vuon', label: 'Lão nông thanh nhàn', prompt: 'Rustic healthy senior, natural weathered skin, rugged hands, peaceful countryside beauty, contented expression.' },
    { id: 'thanh_lich_lao', label: 'Lão niên Thanh lịch', prompt: 'Elegant senior man, very clean groomed white hair, refined sharp features, dignified lightweight fashion aesthetic.' },
    { id: 'van_nhan', label: 'Văn nhân', prompt: 'Traditional literary scholar, poetic gaze, scholarly white hair, calm traditional aesthetic, elegant facial structure.' },
  ]
};

interface VisualProductionProps {
  data: any; 
  productMedias: any[];
  modelReferenceMedia: any; 
  productDescription?: string;
  productMainUrl?: string;
  onModelUpload: () => void;
  aspectRatio: AspectRatio;
  modelGender: string;
  modelAge: number;
  onUpdateData: (d: any) => void; 
  onNext: () => void;
  addJob: (job: { id: string; type: 'image'; label: string; sceneIndex: number; target: string }) => string;
  updateJob: (id: string, status: JobStatus, error?: string) => void;
}

export const VisualProduction: React.FC<VisualProductionProps> = ({ 
  data, 
  productMedias, 
  modelReferenceMedia, 
  productDescription, 
  onModelUpload, 
  aspectRatio, 
  modelGender,
  modelAge,
  onUpdateData, 
  onNext, 
  addJob, 
  updateJob 
}) => {
  const [sceneMode, setSceneMode] = useState<SourceMode>('auto');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [refinementPrompts, setRefinementPrompts] = useState<Record<number, string>>({});
  
  const [showCustomHub, setShowCustomHub] = useState(false);
  const [selectedHubIdeas, setSelectedHubIdeas] = useState<string[]>([]);
  
  const [showAccessoriesHub, setShowAccessoriesHub] = useState(false);
  const [accHubStep, setAccHubStep] = useState<'select' | 'config'>('select');
  const [selectedAccessories, setSelectedAccessories] = useState<string[]>([]);
  const [accessorySourceMode, setAccessorySourceMode] = useState<'auto' | 'upload'>('auto');
  const [accessoryUploads, setAccessoryUploads] = useState<Record<string, any>>({});
  
  const getStylesByAge = (age: number) => {
    if (age < 13) return AGE_SPECIFIC_MALE_STYLES.kids;
    if (age < 18) return AGE_SPECIFIC_MALE_STYLES.teens;
    if (age <= 40) return AGE_SPECIFIC_MALE_STYLES.adults;
    if (age <= 55) return AGE_SPECIFIC_MALE_STYLES.mature;
    return AGE_SPECIFIC_MALE_STYLES.seniors;
  };

  const currentStyles = useMemo(() => getStylesByAge(modelAge), [modelAge]);
  const [selectedMaleStyle, setSelectedMaleStyle] = useState<string>(currentStyles[0].id);
  const [selectedModel, setSelectedModel] = useState(IMAGE_MODELS[0]);

  const filteredHubIdeas = useMemo(() => {
    let segment: any = null;
    if (modelAge < 5) segment = HUB_IDEAS.newborn;
    else if (modelAge < 13) segment = HUB_IDEAS.children;
    else if (modelAge < 18) segment = HUB_IDEAS.teens;
    else if (modelAge <= 40) segment = HUB_IDEAS.adults;
    else if (modelAge <= 55) segment = HUB_IDEAS.mature;
    else segment = HUB_IDEAS.seniors;
    if (!segment) return [];
    if (segment.both) return segment.both;
    if (modelGender === 'Nam') return segment.male || [];
    return segment.female || [];
  }, [modelAge, modelGender]);

  React.useEffect(() => {
    if (!currentStyles.find(s => s.id === selectedMaleStyle)) {
      setSelectedMaleStyle(currentStyles[0].id);
    }
  }, [currentStyles, selectedMaleStyle]);

  const timeline = Array.isArray(data?.script_timeline) ? data.script_timeline : (data?.script_timeline?.script_timeline || []);

  const toggleHubIdea = (idea: string) => {
    setSelectedHubIdeas(prev => prev.includes(idea) ? prev.filter(i => i !== idea) : [...prev, idea]);
  };

  const toggleAccessory = (accLabel: string) => {
    setSelectedAccessories(prev => prev.includes(accLabel) ? prev.filter(i => i !== accLabel) : [...prev, accLabel]);
  };

  const handleAccessoryUpload = async (accLabel: string) => {
    try {
      const media = await Flow.media.select({ filter: 'image' });
      setAccessoryUploads(prev => ({ ...prev, [accLabel]: media }));
    } catch (e) {
      console.error(e);
    }
  };

  const isAccessoryConfigValid = () => {
    if (accessorySourceMode === 'auto') return true;
    return selectedAccessories.every(acc => !!accessoryUploads[acc]);
  };

  const generateScene = async (sceneIdx: number, overridePrompt?: string) => {
    const key = `${sceneIdx}-scene`;
    if (loading[key]) return;

    if (sceneMode === 'upload' && !modelReferenceMedia) {
      alert("Vui lòng tải lên ảnh Model UGC ở cột trái trước khi tạo ảnh.");
      onModelUpload();
      return;
    }

    const jobId = addJob({
      id: `${Date.now()}-${key}`,
      type: 'image',
      label: `Syncing Scene ${sceneIdx + 1}`,
      sceneIndex: sceneIdx,
      target: 'visual'
    });
    
    setLoading(p => ({ ...p, [key]: true }));

    try {
      const scene = timeline[sceneIdx];
      if (!scene) throw new Error("Scene data missing");
      
      const refinement = overridePrompt !== undefined ? overridePrompt : (refinementPrompts[sceneIdx] || '');
      
      const isOutdoor = /street|outside|outdoor|road|park|vỉa hè|đường phố|ngoài trời/i.test(scene.visual_action + ' ' + (scene.ai_visual_generation_prompts?.scene_image_prompt || ''));
      const vietnamContext = isOutdoor 
        ? "SETTING: Authentic Vietnamese street environment, high-end commercial backdrop, real-life urban Vietnam." 
        : "SETTING: Premium minimal commercial studio, clean professional indoor lifestyle setting.";

      let subjectDirective = "";
      let styleEnforcement = "";

      // Embed Hub Ideas & Accessories
      const hubPrompt = selectedHubIdeas.length > 0 ? `\n[SPECIFIC FEATURES]: ${selectedHubIdeas.join(', ')}.` : '';
      const accPrompt = selectedAccessories.length > 0 ? `\n[ACCESSORIES]: ${selectedAccessories.join(', ')}. Ensure accessories are perfectly integrated and consistent.` : '';

      if (sceneMode === 'upload' && modelReferenceMedia) {
        subjectDirective = `IDENTITY LOCK: Exact match to provided model reference image. Maintain face, bone structure, and identity consistently as a Vietnamese model. ${hubPrompt} ${accPrompt}`;
      } else {
        if (modelGender === 'Nam') {
          const styleObj = currentStyles.find(s => s.id === selectedMaleStyle);
          subjectDirective = `MANDATORY CHARACTERISTICS: Authentic Vietnamese male model, native Vietnamese appearance and ethnicity, exactly ${modelAge} years old. 
            ETHNICITY LOCK: Must look 100% Vietnamese. 
            FACE STRUCTURE: Must follow the unique jawline and eye shape described in style. 
            PHYSIQUE: Adhere strictly to the body type mentioned. ${hubPrompt} ${accPrompt}`;
            
          styleEnforcement = `STYLE MASTER KEY: "${styleObj?.label}". 
            VISUAL ATTRIBUTES: ${styleObj?.prompt}.`;
        } else {
          subjectDirective = `SUBJECT: Stunningly beautiful Vietnamese female model, age around ${modelAge}, native Vietnamese ethnicity, fair complexion, polished commercial look. ${hubPrompt} ${accPrompt}`;
        }
      }

      const prompt = `UGC High-end Commercial Production. MANDATORY PRODUCT FIDELITY. Aspect Ratio: ${aspectRatio}.
      
      [MANDATORY PRODUCT]
      - PRODUCT DNA: ${productDescription || "Identical to reference"}.
      
      [SCENE & SUBJECT]
      ACTION: ${scene.visual_action}.
      ${subjectDirective}
      ${styleEnforcement}
      ${vietnamContext}
      
      [TECHNICAL QUALITY]
      Photorealistic 8k, cinematic high-end lighting, commercial photography aesthetic.
      PROMPT BASE: ${scene.ai_visual_generation_prompts?.scene_image_prompt || scene.visual_action}.
      ${refinement ? `\n[USER CUSTOMIZATION]: ${refinement}` : ''}`;

      // Collect reference IDs
      const referenceImageMediaIds = [
        ...productMedias.map(m => m.mediaId),
        ...(modelReferenceMedia ? [modelReferenceMedia.mediaId] : []),
        ...(accessorySourceMode === 'upload' ? Object.values(accessoryUploads).map(m => m.mediaId) : [])
      ].slice(0, 10);

      const res = await Flow.generate.image({
        prompt,
        referenceImageMediaIds,
        modelDisplayName: selectedModel, 
        aspectRatio: aspectRatio
      });

      const newTimeline = [...timeline];
      if (!newTimeline[sceneIdx].generated_assets) newTimeline[sceneIdx].generated_assets = {};
      newTimeline[sceneIdx].generated_assets.scene_image = res;
      onUpdateData({ ...data, script_timeline: newTimeline });
      updateJob(jobId, 'done');
      setRefinementPrompts(prev => ({ ...prev, [sceneIdx]: '' }));
    } catch (e) {
      updateJob(jobId, 'fail', e instanceof Error ? e.message : "Lỗi tạo ảnh");
    } finally {
      setLoading(p => ({ ...p, [key]: false }));
    }
  };

  const generateAll = async () => {
    const promises = timeline.map((_, i) => generateScene(i));
    await Promise.all(promises);
  };

  const isSceneReady = (idx: number) => !!timeline[idx]?.generated_assets?.scene_image;
  const allReady = timeline.length > 0 && timeline.every((_: any, i: number) => isSceneReady(i));

  const getAspectClass = (ratio: AspectRatio) => {
    switch (ratio) {
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '1:1': return 'aspect-square';
      case '4:3': return 'aspect-[4/3]';
      case '3:4': return 'aspect-[3/4]';
      default: return 'aspect-[9/16]';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-[#0a0a0a] py-6 border-b border-white/5 mb-8">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black uppercase tracking-tight">Visual Scene Hub</h2>
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Sản xuất đồng loạt ({aspectRatio})</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <PillButton 
              variant="outline" 
              className={`w-44 ${selectedHubIdeas.length > 0 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/20'}`}
              icon={<span className="material-symbols-outlined text-[18px]">hub</span>}
              onClick={() => setShowCustomHub(true)}
            >
              Custom Hub Model
            </PillButton>
            <PillButton 
              variant="outline" 
              className={`w-44 ${selectedAccessories.length > 0 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-white/20'}`}
              icon={<span className="material-symbols-outlined text-[18px]">checkroom</span>}
              onClick={() => { setShowAccessoriesHub(true); setAccHubStep('select'); }}
            >
              Phụ kiện Model
            </PillButton>
          </div>
          <PillButton 
            variant="outline" 
            className="w-48 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            icon={<span className="material-symbols-outlined text-[18px]">temp_preferences_custom</span>}
            onClick={generateAll}
            disabled={Object.values(loading).some(v => v)}
          >
            Tạo toàn bộ Scene
          </PillButton>
          <PillButton variant="solid" disabled={!allReady} onClick={onNext} className="w-40">Tiếp tục: Video</PillButton>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Settings Sidebar */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 relative lg:sticky lg:top-24 self-start">
          <div className="flex flex-col gap-4 p-5 rounded-3xl bg-[#111] border border-white/10 shadow-xl">
            <SectionLabel>Cấu hình chung</SectionLabel>
            <div className="flex flex-col gap-3">
              <FieldDropdown label="AI Image Model" value={selectedModel} options={IMAGE_MODELS} onChange={setSelectedModel} />
              <div className="flex gap-2">
                <PillButton variant={sceneMode === 'auto' ? 'solid' : 'outline'} onClick={() => setSceneMode('auto')} icon={<span className="material-symbols-outlined text-[16px]">auto_awesome</span>}>Tự động (AI)</PillButton>
                <PillButton variant={sceneMode === 'upload' ? 'solid' : 'outline'} onClick={() => setSceneMode('upload')} icon={<span className="material-symbols-outlined text-[16px]">person_add</span>}>Tải lên</PillButton>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {sceneMode === 'auto' ? (
                <motion.div key="auto-settings" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-4 pt-4 border-t border-white/5 overflow-hidden">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-2">
                     <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Hồ sơ Model</span>
                     <div className="flex justify-between items-center">
                        <span className="text-[12px] font-bold text-white/80">{modelGender}</span>
                        <span className="text-[12px] font-bold text-white/80">{modelAge} tuổi</span>
                     </div>
                  </div>

                  {modelGender === 'Nam' && (
                    <div className="flex flex-col gap-3">
                      <SectionLabel>Distinct Male Style</SectionLabel>
                      <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-2 dark-scrollbar">
                        {currentStyles.map((style) => (
                          <button
                            key={style.id}
                            onClick={() => setSelectedMaleStyle(style.id)}
                            className={`p-2.5 rounded-xl border text-[9px] font-black uppercase text-center leading-tight transition-all h-[44px] flex flex-col items-center justify-center ${
                              selectedMaleStyle === style.id 
                                ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                                : 'bg-black/50 border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                            }`}
                          >
                            <span>{style.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="upload-settings" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-4 pt-4 border-t border-white/5 overflow-hidden">
                   {modelReferenceMedia ? (
                     <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-emerald-500/50 shadow-lg group">
                        <img src={`data:${modelReferenceMedia.mimeType};base64,${modelReferenceMedia.base64}`} className="w-full h-full object-cover" alt="UGC Model" />
                        <button onClick={onModelUpload} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                           <span className="material-symbols-outlined text-white">cached</span>
                           <span className="text-[9px] font-black text-white uppercase">Thay đổi UGC</span>
                        </button>
                     </div>
                   ) : (
                     <PillButton variant="outline" className="h-24 border-dashed border-white/20" icon={<span className="material-symbols-outlined text-2xl text-emerald-400">add_a_photo</span>} onClick={onModelUpload}>
                        Tải ảnh Model
                     </PillButton>
                   )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Scene Grid */}
        <div className="col-span-12 lg:col-span-9 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start pb-20">
          {timeline.map((scene: any, idx: number) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`group flex flex-col gap-3 p-4 rounded-3xl bg-[#111] border transition-all ${isSceneReady(idx) ? 'border-emerald-500/40' : 'border-white/10'}`}
            >
              <div className={`relative w-full rounded-2xl bg-black/40 border border-white/5 overflow-hidden shadow-xl ${getAspectClass(aspectRatio)}`}>
                {scene.generated_assets?.scene_image ? (
                  <img src={`data:${scene.generated_assets.scene_image.mimeType};base64,${scene.generated_assets.scene_image.base64}`} className="w-full h-full object-cover" alt="Generated" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-10">
                    <span className="material-symbols-outlined text-3xl">image</span>
                    <span className="text-[9px] font-bold uppercase">Đang chờ</span>
                  </div>
                )}
                {loading[`${idx}-scene`] && (
                  <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center gap-2">
                     <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded-md border border-white/10">
                  <span className="text-[9px] font-black text-white/90 uppercase">Scene {idx + 1}</span>
                </div>
              </div>

              <div className="flex flex-col flex-1 gap-2">
                <p className="text-[10px] text-white/70 leading-tight line-clamp-2 italic border-l border-emerald-500/30 pl-2">
                  "{scene.visual_action || 'N/A'}"
                </p>
                <textarea 
                  value={refinementPrompts[idx] || ''} 
                  onChange={(e) => setRefinementPrompts(p => ({ ...p, [idx]: e.target.value }))}
                  placeholder="Tinh chỉnh prompt..."
                  className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-[10px] text-white/80 placeholder-white/10 outline-none h-12 resize-none"
                />
                <PillButton 
                  variant={isSceneReady(idx) ? 'outline' : 'solid'} 
                  onClick={() => generateScene(idx)} 
                  disabled={loading[`${idx}-scene`]}
                  className="h-8 flex-1 text-[10px]"
                >
                  {isSceneReady(idx) ? 'Tạo lại' : 'Khởi tạo'}
                </PillButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ACCESSORIES HUB MODAL */}
      <AnimatePresence>
        {showAccessoriesHub && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowAccessoriesHub(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#151515]">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-emerald-400">checkroom</span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Trung tâm Phụ kiện</h2>
                  </div>
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
                    Cập nhật Phụ kiện cho Model ({selectedAccessories.length} đã chọn)
                  </p>
                </div>
                <button onClick={() => setShowAccessoriesHub(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                   <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 dark-scrollbar bg-black/20">
                <AnimatePresence mode="wait">
                  {accHubStep === 'select' ? (
                    <motion.div key="select-step" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex flex-col gap-10">
                      {ACCESSORIES_CATEGORIES.map((cat) => (
                        <div key={cat.id} className="flex flex-col gap-4">
                          <SectionLabel>{cat.label}</SectionLabel>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {cat.items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => toggleAccessory(item.label)}
                                className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                                  selectedAccessories.includes(item.label)
                                    ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                                    : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
                                }`}
                              >
                                <span className="text-[10px] font-bold uppercase truncate">{item.label}</span>
                                {selectedAccessories.includes(item.label) && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div key="config-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-8">
                       <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-6">
                          <SectionLabel>Nguồn nạp dữ liệu Phụ kiện</SectionLabel>
                          <SegmentedToggle 
                            value={accessorySourceMode}
                            onChange={(v) => setAccessorySourceMode(v as any)}
                            items={[
                              { value: 'auto', label: 'Tự động (AI)', icon: <span className="material-symbols-outlined text-[16px]">auto_awesome</span> },
                              { value: 'upload', label: 'Tải lên tài nguyên', icon: <span className="material-symbols-outlined text-[16px]">cloud_upload</span> }
                            ]}
                          />
                          <p className="text-[11px] text-white/40 italic">
                            {accessorySourceMode === 'auto' 
                              ? "AI sẽ tự động sinh các phụ kiện phù hợp nhất với Model và bối cảnh dựa trên mô tả văn bản." 
                              : "Vui lòng tải lên ảnh tham chiếu cho từng phụ kiện để đảm bảo AI vẽ đúng kiểu dáng bạn mong muốn."}
                          </p>
                       </div>

                       {accessorySourceMode === 'upload' && (
                         <div className="flex flex-col gap-4">
                            <SectionLabel>Tải lên tài nguyên tham chiếu</SectionLabel>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedAccessories.map((acc) => (
                                <div key={acc} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-4">
                                  <div className="flex flex-col gap-1 overflow-hidden">
                                    <span className="text-[11px] font-black text-white uppercase truncate">{acc}</span>
                                    {accessoryUploads[acc] ? (
                                      <span className="text-[9px] text-emerald-400 font-bold uppercase">Sẵn sàng: {accessoryUploads[acc].name}</span>
                                    ) : (
                                      <span className="text-[9px] text-red-400 font-bold uppercase">Thiếu: Cần tải lên</span>
                                    )}
                                  </div>
                                  <div className="shrink-0 flex items-center gap-2">
                                     {accessoryUploads[acc] && (
                                       <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                                          <img src={`data:${accessoryUploads[acc].mimeType};base64,${accessoryUploads[acc].base64}`} className="w-full h-full object-cover" />
                                       </div>
                                     )}
                                     <button 
                                      onClick={() => handleAccessoryUpload(acc)}
                                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                                     >
                                       <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                                     </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                         </div>
                       )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-8 border-t border-white/5 bg-[#151515] flex justify-between items-center">
                 {accHubStep === 'config' ? (
                   <button onClick={() => setAccHubStep('select')} className="text-[11px] font-black text-white/40 uppercase hover:text-white flex items-center gap-2">
                     <span className="material-symbols-outlined text-[18px]">arrow_back</span> Quay lại chọn
                   </button>
                 ) : (
                   <button onClick={() => setSelectedAccessories([])} className="text-[11px] font-black text-white/30 uppercase hover:text-red-400">Xóa trắng</button>
                 )}
                 
                 {accHubStep === 'select' ? (
                   <PillButton 
                    variant="solid" 
                    className="w-48 h-12" 
                    disabled={selectedAccessories.length === 0}
                    onClick={() => setAccHubStep('config')}
                   >
                    Tiếp tục cấu hình
                   </PillButton>
                 ) : (
                   <PillButton 
                    variant="solid" 
                    className="w-48 h-12" 
                    disabled={!isAccessoryConfigValid()}
                    onClick={() => setShowAccessoriesHub(false)}
                   >
                    Áp dụng Phụ kiện
                   </PillButton>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CUSTOM HUB MODAL (Idea List) */}
      <AnimatePresence>
        {showCustomHub && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setShowCustomHub(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl bg-[#111] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#151515]">
                <div className="flex flex-col">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="material-symbols-outlined text-emerald-400">hub</span>
                    <h2 className="text-2xl font-black uppercase tracking-tight">Trung tâm Tùy chỉnh Model</h2>
                  </div>
                  <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
                    Ý tưởng cho: {modelGender} | {modelAge} tuổi ({selectedHubIdeas.length} đã chọn)
                  </p>
                </div>
                <button onClick={() => setShowCustomHub(false)} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                   <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 dark-scrollbar bg-black/20">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredHubIdeas.map((idea) => (
                    <button
                      key={idea}
                      onClick={() => toggleHubIdea(idea)}
                      className={`p-4 rounded-2xl border text-left flex flex-col gap-2 transition-all relative group ${
                        selectedHubIdeas.includes(idea)
                          ? 'bg-emerald-500 border-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 border-white/5 hover:border-white/20 text-white/70 hover:text-white'
                      }`}
                    >
                      <span className="text-[11px] font-black uppercase leading-tight">{idea}</span>
                      <div className={`absolute top-2 right-2 w-4 h-4 rounded-full border flex items-center justify-center ${selectedHubIdeas.includes(idea) ? 'border-black bg-black' : 'border-white/20 group-hover:border-white/40'}`}>
                        {selectedHubIdeas.includes(idea) && <span className="material-symbols-outlined text-[12px] text-emerald-400">check</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-8 border-t border-white/5 bg-[#151515] flex justify-between items-center">
                 <button onClick={() => setSelectedHubIdeas([])} className="text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-red-400">Xóa trắng</button>
                 <PillButton variant="solid" className="w-48 h-12 shadow-xl" onClick={() => setShowCustomHub(false)}>Áp dụng Ý tưởng</PillButton>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};