import React, { useState } from 'react';
import { ClassificationDemo } from './components/ClassificationDemo';
import { SegmentationDemo } from './components/SegmentationDemo';
import { PixelBlastBackground } from './components/PixelBlastBackground';

type View = 'home' | 'classification' | 'segmentation';

const App: React.FC = () => {
    const [view, setView] = useState<View>('home');

    const renderView = () => {
        switch (view) {
            case 'classification':
                return <ClassificationDemo />;
            case 'segmentation':
                return <SegmentationDemo />;
            case 'home':
            default:
                return <HomeScreen setView={setView} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <header className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                            ML
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                            MetricLens
                        </h1>
                    </div>
                    {view !== 'home' && (
                        <button
                            onClick={() => setView('home')}
                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
                        >
                            &larr; Back to Home
                        </button>
                    )}
                </header>
                <main>{renderView()}</main>
            </div>
        </div>
    );
};

interface HomeScreenProps {
    setView: (view: View) => void;
}

const Section: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <section className="text-center py-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">{title}</h2>
        <div className="w-24 h-1 bg-indigo-500 mx-auto mb-12"></div>
        {children}
    </section>
);

const FeatureCard: React.FC<{icon: string, title: string, children: React.ReactNode, className?: string}> = ({ icon, title, children, className = '' }) => (
    <div className={`bg-gray-800/50 p-6 rounded-lg border border-gray-700 transition-all hover:border-indigo-500/50 hover:bg-gray-800 ${className}`}>
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400">{children}</p>
    </div>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ setView }) => (
    <div className="animate-fade-in">
        <PixelBlastBackground />
        <div className="relative z-[1]">
            {/* Hero Section */}
            <div className="text-center flex flex-col items-center justify-center" style={{ minHeight: '80vh' }}>
                <div className="max-w-3xl">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
                        Master Model Evaluation Through Interactive Exploration
                    </h2>
                    <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
                        An interactive, educational tool to explore and understand key evaluation metrics for AI classification and segmentation tasks. Adjust parameters in real-time and see how they impact model performance.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <button
                            onClick={() => setView('classification')}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                            Explore Classification
                        </button>
                        <button
                            onClick={() => setView('segmentation')}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-lg text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                            Explore Segmentation
                        </button>
                    </div>
                    <div className="mt-8 flex justify-center items-center gap-x-6 gap-y-2 flex-wrap text-gray-400 text-sm">
                        <span>✓ No signup required</span>
                        <span>✓ Free forever</span>
                        <span>✓ Works in browser</span>
                    </div>
                </div>
            </div>

            {/* How It Works */}
            <Section title="How It Works">
                <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    <FeatureCard icon="1️⃣" title="Choose Task">
                        Pick Classification or Segmentation to start your exploration.
                    </FeatureCard>
                    <FeatureCard icon="2️⃣" title="Adjust Threshold">
                        Move the interactive slider to see the direct impact of changing the model's decision boundary.
                    </FeatureCard>
                    <FeatureCard icon="3️⃣" title="See Results">
                        Watch all metrics, charts, and predictions update instantly to build intuition.
                    </FeatureCard>
                </div>
            </Section>
            
            {/* Why Use This Tool */}
            <Section title="Why Use This Tool?">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <FeatureCard icon="🎯" title="Interactive">Real-time threshold adjustment provides immediate feedback.</FeatureCard>
                    <FeatureCard icon="📊" title="Visual">See how all key metrics and charts are interconnected.</FeatureCard>
                    <FeatureCard icon="🎓" title="Educational">Built-in tooltips and explanations clarify complex concepts.</FeatureCard>
                    <FeatureCard icon="⚡" title="Instant">No complex setup or installation required. Runs directly in your browser.</FeatureCard>
                    <FeatureCard icon="🌐" title="Accessible">Works anywhere, on any device with a modern web browser.</FeatureCard>
                    <FeatureCard icon="🆓" title="Free & Open">This tool is open source and completely free to use, forever.</FeatureCard>
                </div>
            </Section>

            {/* Perfect For */}
            <Section title="Perfect For">
                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    <FeatureCard icon="👨‍🎓" title="Students & Aspiring Professionals">
                        Go beyond theory and gain a practical, hands-on understanding of how evaluation metrics really work.
                    </FeatureCard>
                    <FeatureCard icon="👨‍🏫" title="Educators & Instructors">
                        Use as a powerful, interactive teaching aid for machine learning and data science courses.
                    </FeatureCard>
                </div>
            </Section>
        </div>
    </div>
);


export default App;