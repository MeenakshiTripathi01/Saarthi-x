import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Generate unique certificate code in format: YEAR UNIQUECODE
const generateCertificateCode = () => {
    const now = new Date();
    const year = now.getFullYear();

    // Generate a unique 5-digit code based on timestamp
    const timestamp = now.getTime();
    const uniqueCode = String(timestamp % 100000).padStart(5, '0');

    return `${year} ${uniqueCode}`;
};

const CertificateTemplate = ({ participantName, hackathonTitle, company, rank, isTeam, teamName, date, certificateCode }) => {
    // Always use blue theme - same as your uploaded template
    const colors = {
        primary: '#1e40af',
        secondary: '#3b82f6',
        accent: '#60a5fa'
    };

    // Only customize text based on rank
    const getRankTitle = () => {
        if (!rank) return 'COMPLETION';
        switch (rank) {
            case 1: return 'WINNER - FIRST PLACE';
            case 2: return 'WINNER - SECOND PLACE';
            case 3: return 'WINNER - THIRD PLACE';
            default: return 'ACHIEVEMENT';
        }
    };

    const getAchievementText = () => {
        if (!rank) {
            return `for successfully completing the <strong>${hackathonTitle}</strong> on <strong>${date}</strong>`;
        }

        const position = rank === 1 ? 'First Place' : rank === 2 ? 'Second Place' : rank === 3 ? 'Third Place' : `${rank}th Place`;
        return `for securing <strong>${position}</strong> in the <strong>${hackathonTitle}</strong> on <strong>${date}</strong>`;
    };

    return (
        <div
            id="certificate-content"
            style={{
                width: '1122px',
                height: '794px',
                background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                fontFamily: "'Arial', sans-serif",
                position: 'relative',
                overflow: 'hidden',
                boxSizing: 'border-box',
                padding: '40px'
            }}
        >
            {/* Main White Card */}
            <div style={{
                width: '100%',
                height: '100%',
                background: 'white',
                borderRadius: '15px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative Bottom Left Corner - Blue */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '300px',
                    height: '200px',
                    background: 'linear-gradient(45deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%)',
                    clipPath: 'polygon(0 100%, 100% 100%, 0 0)',
                    opacity: 0.9
                }} />

                {/* Decorative Bottom Right Corner - Blue */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '300px',
                    height: '200px',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%)',
                    clipPath: 'polygon(100% 100%, 100% 0, 0 100%)',
                    opacity: 0.9
                }} />

                {/* Diagonal Stripes Background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `repeating-linear-gradient(
                        45deg,
                        transparent,
                        transparent 50px,
                        rgba(0,0,0,0.02) 50px,
                        rgba(0,0,0,0.02) 100px
                    )`,
                    pointerEvents: 'none'
                }} />

                {/* Content */}
                <div style={{
                    position: 'relative',
                    zIndex: 1,
                    padding: '50px 60px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start'
                    }}>
                        {/* Saarthix Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '24px',
                                fontWeight: 'bold'
                            }}>
                                SX
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    color: '#1e40af',
                                    letterSpacing: '1px'
                                }}>
                                    SAARTHIX
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    color: '#6b7280',
                                    marginTop: '2px'
                                }}>
                                    PLATFORM
                                </div>
                            </div>
                        </div>

                        {/* Certificate Code - Top Right Corner */}
                        <div style={{
                            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                            color: 'white',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            letterSpacing: '1.5px',
                            boxShadow: '0 2px 8px rgba(30,64,175,0.3)'
                        }}>
                            CODE: {certificateCode}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div style={{ textAlign: 'center', marginTop: '30px' }}>
                        {/* Certificate Title */}
                        <h1 style={{
                            fontSize: '64px',
                            fontWeight: 'bold',
                            color: '#1e40af',
                            margin: '0',
                            letterSpacing: '4px',
                            textTransform: 'uppercase'
                        }}>
                            CERTIFICATE
                        </h1>
                        <div style={{
                            fontSize: '20px',
                            color: '#6b7280',
                            marginTop: '5px',
                            letterSpacing: '3px',
                            textTransform: 'uppercase'
                        }}>
                            OF {getRankTitle()}
                        </div>

                        {/* Presented To */}
                        <p style={{
                            fontSize: '16px',
                            color: '#6b7280',
                            margin: '30px 0 15px 0'
                        }}>
                            This certificate is proudly presented to
                        </p>

                        {/* Participant Name */}
                        <h2 style={{
                            fontSize: '52px',
                            fontWeight: 'normal',
                            color: '#1f2937',
                            margin: '15px 0',
                            fontFamily: "'Brush Script MT', cursive",
                            borderBottom: '2px solid #e5e7eb',
                            paddingBottom: '10px',
                            display: 'inline-block',
                            minWidth: '450px'
                        }}>
                            {isTeam ? teamName : participantName}
                        </h2>

                        {isTeam && (
                            <p style={{
                                fontSize: '14px',
                                color: '#9ca3af',
                                marginTop: '8px',
                                fontStyle: 'italic'
                            }}>
                                Team Leader: {participantName}
                            </p>
                        )}

                        {!isTeam && teamName && (
                            <p style={{
                                fontSize: '14px',
                                color: '#9ca3af',
                                marginTop: '8px',
                                fontStyle: 'italic'
                            }}>
                                Member of Team: {teamName}
                            </p>
                        )}

                        {/* Achievement Text */}
                        <p style={{
                            fontSize: '15px',
                            color: '#4b5563',
                            margin: '25px auto',
                            maxWidth: '700px',
                            lineHeight: '1.6'
                        }}
                            dangerouslySetInnerHTML={{ __html: getAchievementText() }}
                        />

                        {/* Company Badge */}
                        <div style={{
                            display: 'inline-block',
                            background: '#f9fafb',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px 30px',
                            marginTop: '10px'
                        }}>
                            <div style={{
                                fontSize: '11px',
                                color: '#9ca3af',
                                marginBottom: '3px'
                            }}>
                                Organized by
                            </div>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#1e40af'
                            }}>
                                {company}
                            </div>
                        </div>
                    </div>

                    {/* Footer with Signatures */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        marginTop: '40px',
                        position: 'relative',
                        zIndex: 2
                    }}>
                        {/* Left Signature */}
                        <div style={{ textAlign: 'center', minWidth: '180px' }}>
                            <div style={{
                                fontFamily: "'Brush Script MT', cursive",
                                fontSize: '24px',
                                color: '#4b5563',
                                marginBottom: '5px'
                            }}>
                                Signature
                            </div>
                            <div style={{
                                borderTop: '2px solid #1f2937',
                                paddingTop: '8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#1f2937'
                            }}>
                                Platform Director
                            </div>
                            <div style={{
                                fontSize: '10px',
                                color: '#9ca3af',
                                marginTop: '2px'
                            }}>
                                Saarthix
                            </div>
                        </div>

                        {/* Center - Date */}
                        <div style={{ textAlign: 'center', minWidth: '180px' }}>
                            <div style={{
                                fontSize: '14px',
                                color: '#6b7280',
                                fontWeight: '500'
                            }}>
                                {date}
                            </div>
                        </div>

                        {/* Right Signature */}
                        <div style={{ textAlign: 'center', minWidth: '180px' }}>
                            <div style={{
                                fontFamily: "'Brush Script MT', cursive",
                                fontSize: '24px',
                                color: '#4b5563',
                                marginBottom: '5px'
                            }}>
                                Signature
                            </div>
                            <div style={{
                                borderTop: '2px solid #1f2937',
                                paddingTop: '8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#1f2937'
                            }}>
                                Event Organizer
                            </div>
                            <div style={{
                                fontSize: '10px',
                                color: '#9ca3af',
                                marginTop: '2px'
                            }}>
                                {company}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const generateCertificatePDF = async (certificateData) => {
    const { participantName, hackathonTitle, company, rank, isTeam, teamName } = certificateData;

    const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Generate unique certificate code
    const certificateCode = generateCertificateCode();

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    document.body.appendChild(container);

    const root = document.createElement('div');
    container.appendChild(root);

    const { createRoot } = await import('react-dom/client');
    const reactRoot = createRoot(root);

    await new Promise((resolve) => {
        reactRoot.render(
            <CertificateTemplate
                participantName={participantName}
                hackathonTitle={hackathonTitle}
                company={company}
                rank={rank}
                isTeam={isTeam}
                teamName={teamName}
                date={date}
                certificateCode={certificateCode}
            />
        );
        setTimeout(resolve, 1000);
    });

    const certificateElement = document.getElementById('certificate-content');
    
    // Wait a bit more to ensure all styles are rendered
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const canvas = await html2canvas(certificateElement, {
        scale: 4, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1122,
        windowHeight: 794,
        allowTaint: false,
        removeContainer: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
            // Ensure all styles are preserved in the cloned document
            const clonedElement = clonedDoc.getElementById('certificate-content');
            if (clonedElement) {
                clonedElement.style.transform = 'none';
                clonedElement.style.position = 'relative';
            }
        }
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    
    // Calculate exact dimensions to match certificate aspect ratio
    // Certificate is 1122x794 (landscape A4 ratio)
    const certificateWidth = 1122;
    const certificateHeight = 794;
    const aspectRatio = certificateWidth / certificateHeight;
    
    // Use A4 landscape dimensions in mm
    const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [297, 210], // A4 landscape: 297mm x 210mm
        compress: true
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate dimensions to maintain aspect ratio and fill the page
    let imgWidth = pdfWidth;
    let imgHeight = pdfWidth / aspectRatio;
    
    // If height exceeds page, scale down
    if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * aspectRatio;
    }
    
    // Center the image
    const xOffset = (pdfWidth - imgWidth) / 2;
    const yOffset = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, '', 'FAST');

    document.body.removeChild(container);

    return pdf;
};

export const downloadCertificate = async (certificateData) => {
    try {
        const pdf = await generateCertificatePDF(certificateData);
        const fileName = `Saarthix_${certificateData.hackathonTitle.replace(/\s+/g, '_')}_Certificate.pdf`;
        pdf.save(fileName);
        return true;
    } catch (error) {
        console.error('Error generating certificate:', error);
        throw error;
    }
};

export const shareOnLinkedIn = async (certificateData) => {
    const { hackathonTitle, company, rank } = certificateData;

    const rankText = rank ? `secured ${rank === 1 ? '🥇 1st' : rank === 2 ? '🥈 2nd' : rank === 3 ? '🥉 3rd' : `${rank}th`} place` : 'participated';

    const text = encodeURIComponent(
        `🎉 Excited to share that I ${rankText} in ${hackathonTitle} organized by ${company} via Saarthix! 🚀\n\nGrateful for this incredible learning experience and the opportunity to showcase my skills.\n\n#Hackathon #Achievement #Innovation #TechCommunity #Saarthix #${company.replace(/\s+/g, '')}`
    );

    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${text}`;

    window.open(linkedInUrl, '_blank', 'width=600,height=600');
};

export default CertificateTemplate;
