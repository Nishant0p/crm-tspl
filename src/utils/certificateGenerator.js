/**
 * Generates and downloads a high-resolution completion certificate for TSPL Group courses.
 * Uses an offscreen HTML5 canvas to produce a crisp 1700x1200 pixel PNG image.
 *
 * @param {string} studentName Name of the candidate
 * @param {string} courseTitle Title of the completed course
 * @param {string} issueDate The formatted date when the course was completed
 * @param {string} certificateId Unique tracking/verification code
 * @param {string} [filename] Optional customized output filename
 */
export function generateCertificateImage(studentName, courseTitle, issueDate, certificateId, filename) {
  const downloadName = filename || `TSPL-Certificate-${certificateId || 'receipt'}.png`;

  const canvas = document.createElement("canvas");
  canvas.width = 1700;
  canvas.height = 1200;
  const ctx = canvas.getContext("2d");

  // 1. Fill Background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, 1700, 1200);

  // 2. Draw Outer Border (Brand Blue - #004B87)
  ctx.lineWidth = 30;
  ctx.strokeStyle = "#004B87";
  ctx.strokeRect(15, 15, 1670, 1170);

  // 3. Draw Inner Border (Brand Orange - #F26522)
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#F26522";
  ctx.strokeRect(45, 45, 1610, 1110);

  // 4. Logo / Brand Name Headers
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const brandY = 180;
  ctx.font = "bold 66px Arial, sans-serif";
  const tsplText = "TSPL";
  const groupText = " GROUP";
  const tsplWidth = ctx.measureText(tsplText).width;
  const groupWidth = ctx.measureText(groupText).width;
  const totalBrandWidth = tsplWidth + groupWidth;
  const startX = 850 - (totalBrandWidth / 2);

  ctx.textAlign = "left";
  ctx.fillStyle = "#004B87";
  ctx.fillText(tsplText, startX, brandY);
  ctx.fillStyle = "#F26522";
  ctx.fillText(groupText, startX + tsplWidth, brandY);

  // 5. Title: "Certificate of Completion"
  ctx.textAlign = "center";
  ctx.font = "bold 42px sans-serif";
  ctx.fillStyle = "#004B87";
  ctx.fillText("CERTIFICATE OF COMPLETION", 850, 290);

  // 6. Presentation text: "This is to proudly certify that"
  ctx.font = "italic 32px Georgia, serif";
  ctx.fillStyle = "#4A5568";
  ctx.fillText("This is to proudly certify that", 850, 395);

  // 7. Candidate Name (Georgia Serif font for elegant credentials look)
  ctx.font = "bold italic 76px Georgia, serif";
  ctx.fillStyle = "#004B87";
  ctx.fillText(studentName, 850, 505);

  // Draw name orange underline
  const nameWidth = Math.max(750, ctx.measureText(studentName).width + 80);
  ctx.strokeStyle = "#F26522";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(850 - (nameWidth / 2), 555);
  ctx.lineTo(850 + (nameWidth / 2), 555);
  ctx.stroke();

  // 8. Description / Reason
  ctx.font = "30px sans-serif";
  ctx.fillStyle = "#2D3748";
  const descLine1 = "has successfully completed the comprehensive training program and";
  const descLine2 = `demonstrated exceptional skills in ${courseTitle}.`;
  const descLine3 = "We appreciate their dedication and hard work.";
  ctx.fillText(descLine1, 850, 660);
  ctx.fillText(descLine2, 850, 715);
  ctx.fillText(descLine3, 850, 770);

  // 9. Footer: Date & Signature
  // Left: Date of Issue
  const footerY = 1000;
  ctx.textAlign = "center";
  ctx.fillStyle = "#1A202C";
  ctx.font = "italic 28px Georgia, serif";
  ctx.fillText(issueDate, 400, footerY - 40);
  // line
  ctx.strokeStyle = "#004B87";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(250, footerY - 20);
  ctx.lineTo(550, footerY - 20);
  ctx.stroke();
  // title
  ctx.fillStyle = "#718096";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("DATE OF ISSUE", 400, footerY + 15);

  // Right: Authorized Director
  ctx.fillStyle = "#1A202C";
  ctx.font = "italic 28px Georgia, serif";
  ctx.fillText("TSPL Group", 1300, footerY - 40);
  // line
  ctx.beginPath();
  ctx.moveTo(1150, footerY - 20);
  ctx.lineTo(1450, footerY - 20);
  ctx.stroke();
  // title
  ctx.fillStyle = "#718096";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("AUTHORIZED DIRECTOR", 1300, footerY + 15);

  // 10. Verification ID (Verification Link/ID at bottom)
  ctx.fillStyle = "#A0AEC0";
  ctx.font = "20px monospace";
  ctx.fillText(`Verification ID: ${certificateId}`, 850, 1110);

  // 11. Trigger Download
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
