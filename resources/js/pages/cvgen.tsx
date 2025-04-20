import { useEffect, useState } from 'react';

export default function CvGen() {
  // Konstanta teks
  const textParts = {
    text1: 'Create ',
    text2: 'a ',
    text3: 'professional ',
    text4: 'CV ',
    text5: 'in ',
    text6: 'minutes',
    text7: '.',
  };

  // State
  const [typedText, setTypedText] = useState('');
  const [showFeatures, setShowFeatures] = useState(false);
  const features = ['free', 'easy', 'fast', 'professional'];
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [hoveredTextPart, setHoveredTextPart] = useState<string | null>(null);
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [isTypingFeaturesComplete, setIsTypingFeaturesComplete] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState<boolean[]>([false, false, false, false]);
  const [themeChanged, setThemeChanged] = useState(0);
  const [imageVisible, setImageVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  // Event listener untuk perubahan tema
  useEffect(() => {
    const handleThemeChange = () => setThemeChanged(prev => prev + 1);
    document.addEventListener('themeChange', handleThemeChange);
    return () => document.removeEventListener('themeChange', handleThemeChange);
  }, []);

  // Efek animasi pengetikan
  useEffect(() => {
    const fullText = Object.values(textParts).join('');
    let currentIndex = 0;

    // Reset state
    setTypedText('');
    setShowFeatures(false);
    setIsTypingComplete(false);
    setIsTypingFeaturesComplete(false);
    setFeaturesVisible([false, false, false, false]);
    setImageVisible(false);
    setButtonVisible(false);

    // Animasi gambar dengan slide dari kiri
    setTimeout(() => {
      setImageVisible(true);
    }, 300);

    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setShowFeatures(true);
        setIsTypingComplete(true);

        // Animasi transisi untuk fitur dengan delay
        features.forEach((_, index) => {
          setTimeout(() => {
            setFeaturesVisible(prev => {
              const newState = [...prev];
              newState[index] = true;
              return newState;
            });
          }, index * 500);
        });

        // Tampilkan tombol setelah semua fitur muncul dengan delay 0.5 detik
        setTimeout(() => {
          setIsTypingFeaturesComplete(true);
          
          // Tambahkan delay 0.5 detik (500ms) sebelum menampilkan tombol
          setTimeout(() => {
            setButtonVisible(true);
          }, 500);
          
        }, features.length * 500 + 300);
      }
    }, 70);

    return () => clearInterval(typingInterval);
  }, [themeChanged]);

  // Fungsi untuk menghitung posisi teks
  const getTextPosition = (partIndex: number): number => {
    const parts = Object.values(textParts);
    return parts.slice(0, partIndex).reduce((sum, part) => sum + part.length, 0);
  };

  // Fungsi untuk render bagian teks
  const renderTextPart = (part: string, index: number, key: string) => {
    const position = getTextPosition(index);
    const prevPosition = index > 0 ? getTextPosition(index) : 0;
    const isVisible = typedText.length > prevPosition;

    if (!isVisible) return null;

    const isFirstOrLast = key === 'text3' || key === 'text4' || key === 'text6';
    const activeColor = isFirstOrLast ? 'text-red-600' : 'text-gray-900 dark:text-white';
    const hoverColor = isFirstOrLast ? 'text-gray-900 dark:text-white' : 'text-red-600';

    return (
      <span
        className={`transition-colors duration-300 ${hoveredTextPart === key ? hoverColor : activeColor}`}
        onMouseEnter={() => setHoveredTextPart(key)}
        onMouseLeave={() => setHoveredTextPart(null)}
      >
        {part.substring(0, Math.min(typedText.length - prevPosition, part.length))}
      </span>
    );
  };

  return (
    <div id="cvgen" className="py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 px-2 pb-6 md:pb-10">
          <div className="flex flex-col w-full md:w-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">
              {typedText && (
                <>
                  {renderTextPart(textParts.text1, 0, 'text1')}
                  {renderTextPart(textParts.text2, 1, 'text2')}
                  {renderTextPart(textParts.text3, 2, 'text3')}
                  {renderTextPart(textParts.text4, 3, 'text4')}
                  {renderTextPart(textParts.text5, 4, 'text5')}
                  {renderTextPart(textParts.text6, 5, 'text6')}
                  {renderTextPart(textParts.text7, 6, 'text7')}
                </>
              )}
              {isTypingComplete ? null : <span className="animate-blink">|</span>}
            </h1>
            <div className="text-lg md:text-xl font-bold mb-4 md:mb-6">
              {showFeatures && (
                <div className="flex flex-row space-x-2">
                  {features.map((feature, index) => (
                    <span
                      key={feature}
                      className={`transition-all duration-300 cursor-pointer ${hoveredFeature === feature ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}
                      style={{
                        opacity: featuresVisible[index] ? 1 : 0,
                        transform: `translateX(${featuresVisible[index] ? 0 : 50}px)`,
                        transitionDelay: `${index * 0.2}s`
                      }}
                      onMouseEnter={() => setHoveredFeature(feature)}
                      onMouseLeave={() => setHoveredFeature(null)}
                    >
                      {index > 0 ? ' • ' : ''}{feature}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {isTypingFeaturesComplete ? 
              <a 
                href="/generate-cv" 
                className="inline-block bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 md:px-8 rounded-md transition-all duration-500 text-sm md:text-base w-40 md:w-48 text-center"
                style={{
                  opacity: buttonVisible ? 1 : 0,
                  transform: `translateY(${buttonVisible ? 0 : 20}px)`,
                }}
              >
                try now for free!
              </a> 
            : null}
          </div>
          <img
            src="/assets/images/cv.svg"
            alt="form illustration"
            className="w-full md:w-3/5 lg:h-3/5 max-w-md transition-all duration-900"
            style={{
              opacity: imageVisible ? 1 : 0,
              transform: `translateX(${imageVisible ? 0 : 100}px)`
            }}
          />
        </div>
      </div>
    </div>
  );
}
