import React, { useRef, useState, useEffect } from 'react';
import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, Button, useToast } from '@chakra-ui/react';
import SignatureCanvas from 'react-signature-canvas';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';

export default function AgreementSign({ labInfo }) {
  const [companyName, setCompanyName] = useState('');
  const [printedName, setPrintedName] = useState('');
  const [signDate, setSignDate] = useState('');
  const sigPad = useRef();
  const toast = useToast();
  const navigate = useNavigate();
  const [isSigned, setIsSigned] = useState(false);

  useEffect(() => {
    // Do not pre-fill the date; leave it blank so the user must select it
    if (labInfo && labInfo.company_name) setCompanyName(labInfo.company_name);
  }, [labInfo]);

  const handleSign = async () => {
    const pdf = new jsPDF();
    pdf.setFontSize(10);
    pdf.text('MOBILE PHLEBOTOMY CONTRACTOR AGREEMENT', 10, 10);
    pdf.setFontSize(8);
    pdf.text(`Company Name: ${companyName}`, 10, 20);
    pdf.text(`Printed Name/Title: ${printedName}`, 10, 25);
    pdf.text(`Date: ${signDate}`, 10, 30);
    pdf.text('Signature:', 10, 35);
    if (sigPad.current) {
      const sigData = sigPad.current.getCanvas().toDataURL('image/png');
      pdf.addImage(sigData, 'PNG', 40, 28, 50, 20);
    }
    pdf.text('---', 10, 55);
    pdf.setFontSize(7);
    pdf.text(`Agreement:`, 10, 60);
    pdf.setFontSize(6);
    pdf.text(`(See attached full agreement text)`, 10, 65);
    pdf.save('MobilePhlebotomyAgreement.pdf');
    localStorage.setItem('agreement_signed', 'true');
    toast({ title: 'Agreement signed!', status: 'success' });
    navigate(`/lab/${labInfo?.id || ''}`);
  };

  return (
    <Box maxW="700px" mx="auto" mt={8} p={8} bg="white" borderRadius="xl" boxShadow="xl">
      <Heading size="lg" mb={4}>Sign Business Agreement</Heading>
      <Box maxH="300px" overflowY="auto" mb={4} p={2} borderWidth="1px" borderRadius="md" bg="gray.50">
        <Text fontSize="md" fontWeight="bold" mb={2}>MOBILE PHLEBOTOMY CONTRACTOR AGREEMENT</Text>
        <Text fontSize="sm" mb={2}>
          This MOBILE PHLEBOTOMY CONTRACTOR AGREEMENT (“Agreement”) is made effective on <b>{signDate}</b> (“Effective Date”) between <b>QUALITY LABORATORY</b>, a New Jersey limited liability company (“Contractor”) and <b>{companyName || '_____________________'}</b> (“Company”).
        </Text>
        <Box as="ol" pl={4} mb={2}>
          <li><b>Qualifications & Services:</b> Contractor employs phlebotomists who are in good standing, experienced, qualified, licensed, certified, and approved to draw blood and collect other specimens without restriction or limitation in the state in which Company is performing services. The Company hereby retains Contractor's services to draw and collect patient specimens as needed by the Company.</li>
          <li><b>Instructions & Supplies:</b> The Company shall advise Contractor of the patient's location, who is in need of phlebotomy services, the specimens required, and the time period in which such specimens are needed by the Company. Contractor shall, within a reasonable time period, collect the patient specimens from such patients and shall prepare and maintain all appropriate documentation related to the collection and delivery of such specimens. The Company shall provide Contractor with all necessary supplies to collect and process the specimens.</li>
          <li><b>Compensation & Compliance:</b> For each patient specimen collected, the Company shall pay Contractor the sum of $30. Contractor shall submit an invoice to the Company each month detailing the specimens collected. The Company shall pay such invoice within 15 days of receipt. A $10 payment delay fee will apply if the invoice is not paid within 15 days. Contractor agrees to comply with all applicable local, state, and federal laws and regulations. Contractor further agrees to comply with all best practices guidelines regarding phlebotomy services.</li>
          <li><b>Independent Contractor:</b> Contractor is an independent contractor of the Company, and this Agreement shall not constitute the formation of a partnership, joint venture, employment or master/servant relationship.</li>
          <li><b>Term & Termination:</b> The term of this Agreement shall begin on the Effective Date and shall continue for 1 year unless otherwise terminated. After the expiration of the initial term, this Agreement shall automatically renew for subsequent 1 year periods unless terminated. Either party may terminate this Agreement without cause with 10 days' written notice.</li>
          <li><b>Confidentiality:</b> Contractor shall keep all confidential and proprietary information of the Company ("Lab Information") confidential and shall refrain from disclosing any Lab Information to any third party except as is required to perform Contractor's duties pursuant to this Agreement. "Lab Information" shall include, but is not limited to, patient names and addresses, patient lists, referral sources, protocols, contracts, pricing, financial data, marketing plans, methods of operation, manuals, personnel information, and other information not publicly available.</li>
          <li><b>Indemnification:</b> Each party shall defend, indemnify, keep, save and hold harmless, the other, its directors, officers, employees, agents and independent contractors, from any and all suits, damages, liabilities, losses or expenses, including reasonable attorney's fees (''Claims"), which arise from the acts and omissions of the other party. The terms and provisions regarding indemnification shall survive the termination of this Agreement.</li>
          <li><b>Governing Law:</b> This Agreement shall be governed by the laws of the State of New Jersey.</li>
          <li><b>Modification:</b> This Agreement shall not be modified, amended, or supplemented except as specified herein or by written instrument executed by both parties.</li>
        </Box>
        <Text fontSize="sm" mt={2}>
          <b>IN WITNESS WHEREOF</b>, the parties hereto have executed this Agreement as of the Effective Date.<br/>
          <b>CONTRACTOR</b><br/>
          By: QUALITY LABORATORY<br/><br/>
          <b>COMPANY:</b><br/>
          Company Name: {companyName || '_____________________'}<br/>
          Printed Name/Title: {printedName || '____________________'}<br/>
          {sigPad.current && !sigPad.current.isEmpty() ? <span>Signed electronically</span> : null}<br/>
          Date: {signDate}
        </Text>
      </Box>
      <VStack align="start" spacing={4}>
        <FormControl isRequired>
          <FormLabel>Company Name</FormLabel>
          <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Printed Name/Title</FormLabel>
          <Input value={printedName} onChange={e => setPrintedName(e.target.value)} placeholder="Name / Title" autoComplete="off" />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Date</FormLabel>
          <Input type="date" value={signDate} onChange={e => setSignDate(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Signature</FormLabel>
          <Box border="1px solid #ccc" borderRadius="md" p={2}>
            <SignatureCanvas
              penColor="black"
              canvasProps={{ width: 400, height: 100, className: 'sigCanvas' }}
              ref={sigPad}
              onEnd={() => setIsSigned(!sigPad.current.isEmpty())}
              onClear={() => setIsSigned(false)}
            />
          </Box>
          <Button mt={2} size="sm" onClick={() => sigPad.current && sigPad.current.clear()}>Clear</Button>
        </FormControl>
        {(!companyName || !printedName || !signDate || !isSigned) && (
          <Text color="red.500" fontSize="sm" mt={2}>
            Please fill all fields and sign to continue.
          </Text>
        )}
        <Button
          colorScheme="blue"
          onClick={handleSign}
          isDisabled={
            !companyName ||
            !printedName ||
            !signDate ||
            !isSigned
          }
        >
          Complete & Download PDF
        </Button>
      </VStack>
    </Box>
  );
} 