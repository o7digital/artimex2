// Privacy notice for the Artimex website.
import type { Locale } from './content';

export const privacyPaths = { es: '/es/aviso-de-privacidad/', en: '/en/privacy-notice/' };
interface PrivacySection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  closing?: string[];
  links?: [string, string][];
}
interface PrivacyCopy {
  title: string; titleLead: string; titleEm: string; description: string;
  eyebrow: string; updated: string; intro: string; home: string;
  contents: string; contact: string; department: string; phone: string;
  request: string; requestSubject: string; summaryTitle: string;
  summary: [string, string][]; categoriesTitle: string;
  categories: [string, string][]; sections: PrivacySection[];
}

export const privacyNotice: { updated: string } & Record<Locale, PrivacyCopy> = {
  updated: '2026-10-06',
  en: {
    title: 'Privacy notice', titleLead: 'Privacy', titleEm: 'notice.',
    description: 'How Artimex Bakery handles website and inquiry information, your California and U.S. privacy rights, and how to contact us.',
    eyebrow: 'Artimex Bakery · Website information', updated: 'Effective & last updated: October 6, 2026',
    intro: 'Understand what information is involved when you visit Artimex, contact our team or explore a bakery program — and how to ask about your privacy.',
    home: 'Return home', contents: 'In this notice', contact: 'Privacy contact', department: 'Artimex Bakery Sales Department',
    phone: 'Phone', request: 'Make a privacy request', requestSubject: 'Artimex privacy request',
    summaryTitle: 'At a glance',
    summary: [
      ['Scope', 'The website and inquiries initiated through it.'],
      ['Tracking', 'Google Analytics measures website usage.'],
      ['Your options', 'Contact us by email, telephone or postal mail.'],
    ],
    categoriesTitle: 'Information, sources and purposes',
    categories: [
      ['Contact & inquiry information', 'Your name, email, phone number, business details, delivery area, product interests and message contents, when you choose to provide them. Source: you or someone communicating on your behalf. Purpose: answer inquiries and discuss products or a wholesale program.'],
      ['Professional information', 'A résumé, work history, education or other experience you voluntarily send in response to the careers invitation. Source: you. Purpose: review your inquiry about future opportunities.'],
      ['Technical visit information', 'Hosting and security providers may process IP address, request time, requested page, referring page, browser, device and security events. Source: your browser or device. Purpose: deliver the website, troubleshoot and protect the service.'],
      ['Privacy request records', 'Your contact details, requested action and information reasonably needed to verify identity or an agent’s authority. Source: you or your authorized agent. Purpose: handle, document and follow up on your request.'],
    ],
    sections: [
      {
        id: 'scope', title: 'Who we are and what this notice covers',
        paragraphs: [
          'Artimex Bakery, presented on this website as Artimex Artisan Mexican Bakery ("Artimex," "we," "us"), operates this website. Our contact address is 12764 Florence Avenue, Santa Fe Springs, CA 90670, United States.',
          'This notice covers the public website, technical information associated with visits, and sales, wholesale, careers and privacy inquiries initiated through the website. It does not describe every separate purchase, employment or offline business process. Additional notices may be provided when another service collects information.',
          'Privacy inquiries are directed to the Artimex Bakery Sales Department using the contact details on this page. An individual’s rights depend on the applicable law and the circumstances of the processing.',
        ],
      },
      {
        id: 'information', title: 'Information involved in using the website',
        paragraphs: [
          'We receive the information you choose to send to Artimex. Visiting the website or choosing a product does not itself send a sales inquiry. Email links open your email application; Artimex receives the message only when you send it.',
          'Product selections are held temporarily in the open page and are not saved in a customer account or persistent browser storage. Reloading the page clears the selection. The website does not currently collect payment-card information or complete online payments.',
          'The website does not ask for government identification numbers, financial credentials, precise device location, biometric identifiers or health information. Please provide only the details needed for your inquiry. Message contents or a résumé may include additional personal information that you choose to disclose.',
        ],
      },
      {
        id: 'purposes', title: 'How information is used',
        bullets: [
          'Respond to messages, product questions, catalog requests and wholesale inquiries.',
          'Discuss an assortment, service area or proposed business relationship that you request.',
          'Consider professional experience voluntarily submitted about future opportunities.',
          'Deliver and secure the website, investigate errors and prevent misuse.',
          'Process privacy requests, maintain necessary records and meet applicable legal obligations.',
        ],
        paragraphs: [
          'The current website does not use visitor information for targeted advertising, behavioral profiling or automated decisions with legal or similarly significant effects. It does not enroll visitors in a newsletter.',
        ],
      },
      {
        id: 'disclosures', title: 'Who may receive information',
        paragraphs: [
          'Information may be handled by Artimex personnel who need it to respond to your inquiry, and by providers that support website hosting, security, technical operations or email communications. The website is hosted by Vercel. Technical visit information may be processed by Vercel to deliver and protect the site.',
          'We may disclose information when required by law or a valid legal process, to address fraud or security incidents, to protect legal rights, or to professional advisers assisting with those matters. If a business transaction requires a transfer of relevant records, the applicable privacy obligations continue to govern their handling.',
          'Providers may process information in the United States or other locations in which they operate. Information sent to an external service, such as your email provider, is also subject to that service’s practices. External websites linked here have their own privacy notices.',
        ],
        links: [['Vercel privacy notice', 'https://vercel.com/legal/privacy-notice']],
      },
      {
        id: 'retention', title: 'Retention and protection',
        paragraphs: [
          'Retention depends on the information and its purpose: inquiry records are needed to respond and follow up; professional submissions are relevant to the opportunity discussed; privacy request records document the request and its resolution; technical logs support hosting and security. Relevant records may also be needed for applicable legal, accounting or dispute obligations.',
          'We assess retention using the nature of the information, the status of the inquiry or relationship, legal requirements and the need to resolve claims. This notice does not assign a fixed retention period to every record. You may ask about the retention applicable to information associated with your inquiry.',
          'The website is delivered over HTTPS. We seek to protect information with safeguards appropriate to its nature, but no internet transmission or storage system can be guaranteed completely secure. Contact us if you believe personal information has been exposed through this website.',
        ],
      },
      {
        id: 'cookies', title: 'Cookies, analytics and browser signals',
        paragraphs: [
          'This website uses Google Analytics to measure visits and website usage. Google Analytics may use cookies and process information about pages visited, browser, device and interactions. Product selections do not create persistent cookies or local-storage entries. Hosting and security services may still process technical requests needed to serve and protect the site.',
          'The website does not track you across other websites for advertising. It does not change its behavior in response to the older Do Not Track (DNT) signal because that cross-site tracking is not performed.',
          'Global Privacy Control (GPC) communicates a choice to opt out of sale or sharing. The current website has no sale or cross-context advertising sharing to disable; that remains the case when a GPC signal is present. If applicable processing is introduced, a legally required opt-out signal will be honored and the relevant controls and notice will be updated.',
          'If analytics or advertising tools are added, this notice will describe the tools, information, purposes, retention and available choices before they are activated. Any legally required consent or opt-out mechanism will be provided. You can also review cookie and privacy settings in your browser.',
        ],
      },
      {
        id: 'sale-sharing', title: 'Sale, advertising sharing and sensitive information',
        paragraphs: [
          'Through the current website, Artimex does not sell personal information or share it for cross-context behavioral advertising. Disclosures needed for hosting, security or responding to an inquiry are described separately above.',
          'The website does not use sensitive personal information to infer characteristics about visitors or for advertising. If you voluntarily send information that is sensitive, it should be limited to what is needed for your inquiry. California rights to restrict certain uses of sensitive information apply where the law requires them.',
        ],
      },
      {
        id: 'california', title: 'California privacy rights',
        paragraphs: [
          'California’s Online Privacy Protection Act (CalOPPA) addresses transparency about website information, recipients, privacy choices and changes to a notice. This page describes those practices for the current website.',
          'Where the California Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act (CPRA), applies to Artimex and the information involved, California residents may exercise the rights below. The CCPA’s business coverage depends on statutory criteria; posting this notice is not a representation that every provision applies to every Artimex interaction.',
        ],
        bullets: [
          'Know and access the categories and specific pieces of personal information, its sources, purposes and recipients, and obtain a portable copy where required.',
          'Request correction of inaccurate information or deletion, subject to legal exceptions.',
          'Opt out of sale or sharing for cross-context behavioral advertising, including through a qualifying privacy preference signal.',
          'Limit certain uses and disclosures of sensitive personal information when that right applies.',
          'Receive equal treatment for exercising applicable privacy rights.',
        ],
        closing: [
          'Where California’s Shine the Light law applies, you may also request information about disclosures to third parties for their own direct marketing. Use the privacy contact below.',
          'The information categories and sources described in this notice concern this website and inquiries initiated through it. A request can ask about the legally required lookback period and other relevant Artimex records; it is not limited to your most recent visit.',
        ],
        links: [['California Privacy Protection Agency', 'https://cppa.ca.gov/faq.html'], ['California online privacy law', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=22575.']],
      },
      {
        id: 'us-rights', title: 'Other U.S. residents and communications',
        paragraphs: [
          'State privacy laws differ in their scope, exemptions and available rights. Where a law covering your state, Artimex and the processing grants them, you may request access, correction, deletion or portability; opt out of targeted advertising, sale or certain significant profiling; withdraw a consent where applicable; or appeal a denied request.',
          'To appeal, contact the same privacy address with the subject "Privacy appeal," identify the request and explain why you seek review. We will assess the appeal under the applicable law and explain the outcome. You may also contact your state Attorney General or other competent regulator.',
          'If you receive a marketing email from Artimex, you may use its unsubscribe method or email us to stop future marketing messages. Opt-out requests for commercial email will be honored within the period required by CAN-SPAM, no later than 10 business days. Necessary responses to your inquiry or transactional communications are treated separately.',
        ],
        links: [['FTC information on commercial email', 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business']],
      },
      {
        id: 'privacy-rights', title: 'How to make a privacy request',
        paragraphs: [
          'Email sales@artimex.com with the subject "Artimex privacy request," call 562-777-0924, or write to Artimex Bakery Sales Department, 12764 Florence Avenue, Santa Fe Springs, CA 90670, United States. State the action you request and provide a way to reply. You do not need a website account.',
          'We may ask for information reasonably needed to verify an access, correction or deletion request and protect someone else’s information. An authorized agent may be asked to provide evidence of authority and, when required, direct confirmation from you. Avoid sending identity documents or sensitive identifiers unless we explain why they are needed and how to provide them appropriately.',
          'Response periods and exceptions follow the applicable law. For covered CCPA requests to know, correct or delete, receipt is acknowledged within 10 business days and a substantive response is generally due within 45 calendar days. A permitted extension of up to 45 additional days will be explained. Applicable sale/sharing opt-outs and sensitive-information limitations are handled as soon as feasible and within 15 business days.',
          'An advertising opt-out is not subject to the same identity verification as a request to disclose personal information. If a request cannot be fulfilled, we will explain the applicable reason and any available appeal process. Requests are generally free unless the applicable law permits a charge.',
        ],
      },
      {
        id: 'children', title: 'Children’s privacy',
        paragraphs: [
          'This website is intended for general business and product information and is not directed to children under 13. We do not knowingly solicit personal information from children under 13 through it. A parent or guardian who believes a child’s information was sent to Artimex can contact us to request its review and removal as appropriate.',
          'The current website does not sell or share children’s personal information for advertising. If a future service is directed to children or introduces a covered use of their information, additional requirements, including applicable COPPA protections and California protections for minors, must be addressed before that use.',
        ],
        links: [['FTC children’s privacy resources', 'https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy']],
      },
      {
        id: 'updates', title: 'Changes to this notice',
        paragraphs: [
          'We will post updated versions here with an effective and last-updated date. Material changes will be highlighted on this page or otherwise communicated when required by law. New purposes, tools or collection points will be accompanied by the notice and choices required for that processing.',
          'Contact Artimex with questions about this notice, the information associated with an inquiry or the choices available to you. This notice does not remove rights or protections granted by applicable law.',
        ],
      },
    ],
  },
  es: {
    title: 'Aviso de privacidad', titleLead: 'Aviso de', titleEm: 'privacidad.',
    description: 'Cómo Artimex Bakery trata la información del sitio y las consultas, tus derechos en California y Estados Unidos y cómo contactarnos.',
    eyebrow: 'Artimex Bakery · Información del sitio', updated: 'Vigencia y última actualización: 6 de octubre de 2026',
    intro: 'Conoce qué información interviene cuando visitas Artimex, contactas a nuestro equipo o exploras un programa de panadería, y cómo consultar sobre tu privacidad.',
    home: 'Volver al inicio', contents: 'En este aviso', contact: 'Contacto de privacidad', department: 'Departamento de Ventas de Artimex Bakery',
    phone: 'Teléfono', request: 'Enviar una solicitud de privacidad', requestSubject: 'Solicitud de privacidad Artimex',
    summaryTitle: 'Lo esencial',
    summary: [
      ['Alcance', 'El sitio web y las consultas iniciadas a través de él.'],
      ['Seguimiento', 'Google Analytics mide el uso del sitio web.'],
      ['Tus opciones', 'Contáctanos por correo electrónico, teléfono o correo postal.'],
    ],
    categoriesTitle: 'Información, fuentes y finalidades',
    categories: [
      ['Datos de contacto y consultas', 'Nombre, correo electrónico, teléfono, datos del negocio, zona de entrega, productos de interés y contenido del mensaje, cuando decides proporcionarlos. Fuente: tú o quien se comunica en tu nombre. Finalidad: responder consultas y conversar sobre productos o programas de mayoreo.'],
      ['Información profesional', 'Currículum, experiencia laboral, estudios u otros antecedentes que envías voluntariamente al responder a la invitación de empleo. Fuente: tú. Finalidad: revisar tu consulta sobre oportunidades futuras.'],
      ['Datos técnicos de la visita', 'Los proveedores de alojamiento y seguridad pueden tratar dirección IP, hora de la solicitud, página solicitada, página de referencia, navegador, dispositivo y eventos de seguridad. Fuente: tu navegador o dispositivo. Finalidad: servir el sitio, resolver errores y proteger el servicio.'],
      ['Registros de solicitudes de privacidad', 'Datos de contacto, acción solicitada e información razonablemente necesaria para verificar la identidad o la representación. Fuente: tú o tu representante autorizado. Finalidad: atender, documentar y dar seguimiento a la solicitud.'],
    ],
    sections: [
      {
        id: 'scope', title: 'Quiénes somos y qué cubre este aviso',
        paragraphs: [
          'Artimex Bakery, presentada en este sitio como Artimex Artisan Mexican Bakery ("Artimex" o "nosotros"), opera este sitio web. Nuestra dirección de contacto es 12764 Florence Avenue, Santa Fe Springs, CA 90670, Estados Unidos.',
          'Este aviso cubre el sitio público, los datos técnicos asociados a las visitas y las consultas de ventas, mayoreo, empleo y privacidad iniciadas a través del sitio. No describe todos los procesos de compra, empleo o actividad comercial fuera del sitio. Pueden proporcionarse avisos adicionales cuando otro servicio recopile información.',
          'Las consultas de privacidad se dirigen al Departamento de Ventas de Artimex Bakery mediante los datos de contacto de esta página. Los derechos de una persona dependen de la ley aplicable y de las circunstancias del tratamiento.',
        ],
      },
      {
        id: 'information', title: 'Información relacionada con el uso del sitio',
        paragraphs: [
          'Recibimos la información que decides enviar a Artimex. Visitar el sitio o elegir un producto no envía por sí solo una consulta de ventas. Los enlaces de correo abren tu aplicación de correo; Artimex recibe el mensaje únicamente cuando lo envías.',
          'La selección de productos permanece temporalmente en la página abierta y no se guarda en una cuenta de cliente ni en almacenamiento persistente del navegador. Al recargar la página, la selección se borra. El sitio no recopila actualmente datos de tarjetas ni completa pagos en línea.',
          'El sitio no solicita números de identificación oficial, credenciales financieras, ubicación precisa del dispositivo, identificadores biométricos ni datos de salud. Proporciona únicamente lo necesario para tu consulta. El contenido de un mensaje o currículum puede incluir información personal adicional que decides comunicar.',
        ],
      },
      {
        id: 'purposes', title: 'Para qué se utiliza la información',
        bullets: [
          'Responder mensajes, preguntas sobre productos, solicitudes de catálogo y consultas de mayoreo.',
          'Conversar sobre un surtido, una zona de servicio o una relación comercial que solicitas.',
          'Considerar la experiencia profesional enviada voluntariamente sobre oportunidades futuras.',
          'Servir y proteger el sitio, investigar errores y prevenir usos indebidos.',
          'Atender solicitudes de privacidad, mantener los registros necesarios y cumplir obligaciones legales aplicables.',
        ],
        paragraphs: [
          'El sitio actual no utiliza los datos de visitantes para publicidad dirigida, perfiles de comportamiento ni decisiones automatizadas con efectos legales o de importancia similar. No inscribe a visitantes en un boletín.',
        ],
      },
      {
        id: 'disclosures', title: 'Quién puede recibir la información',
        paragraphs: [
          'La información puede ser tratada por personal de Artimex que la necesita para responder tu consulta y por proveedores que apoyan el alojamiento, la seguridad, las operaciones técnicas o las comunicaciones por correo. El sitio se aloja en Vercel. Vercel puede tratar datos técnicos de visitas para servir y proteger el sitio.',
          'Podemos comunicar información cuando lo exige la ley o un procedimiento legal válido, para atender fraude o incidentes de seguridad, proteger derechos legales o consultar a asesores profesionales sobre esos asuntos. Si una operación comercial requiere transferir registros relevantes, su tratamiento sigue sujeto a las obligaciones de privacidad aplicables.',
          'Los proveedores pueden tratar datos en Estados Unidos u otros lugares donde operan. Los datos enviados a un servicio externo, como tu proveedor de correo, también están sujetos a sus prácticas. Los sitios externos enlazados aquí tienen sus propios avisos de privacidad.',
        ],
        links: [['Aviso de privacidad de Vercel', 'https://vercel.com/legal/privacy-notice']],
      },
      {
        id: 'retention', title: 'Conservación y protección',
        paragraphs: [
          'La conservación depende de la información y su finalidad: los registros de consultas permiten responder y dar seguimiento; los antecedentes profesionales son relevantes para la oportunidad comentada; los registros de privacidad documentan la solicitud y su resolución; los registros técnicos apoyan el alojamiento y la seguridad. También puede ser necesario conservar registros por obligaciones legales, contables o relacionadas con controversias.',
          'Evaluamos la conservación según la naturaleza de los datos, el estado de la consulta o relación, las exigencias legales y la necesidad de resolver reclamaciones. Este aviso no asigna un plazo único a todos los registros. Puedes preguntar por la conservación aplicable a los datos relacionados con tu consulta.',
          'El sitio se sirve mediante HTTPS. Procuramos proteger los datos con medidas adecuadas a su naturaleza, aunque ninguna transmisión o sistema de almacenamiento en internet puede garantizarse completamente seguro. Contáctanos si crees que se han expuesto datos personales a través de este sitio.',
        ],
      },
      {
        id: 'cookies', title: 'Cookies, analítica y señales del navegador',
        paragraphs: [
          'Este sitio utiliza Google Analytics para medir las visitas y el uso del sitio web. Google Analytics puede utilizar cookies y tratar información sobre las páginas visitadas, el navegador, el dispositivo y las interacciones. La selección de productos no crea cookies persistentes ni entradas de almacenamiento local. Los servicios de alojamiento y seguridad pueden tratar las solicitudes técnicas necesarias para servir y proteger el sitio.',
          'El sitio no realiza seguimiento entre diferentes sitios para fines publicitarios. No cambia su comportamiento ante la señal antigua Do Not Track (DNT) porque no realiza ese seguimiento.',
          'Global Privacy Control (GPC) comunica una opción de excluirse de la venta o del intercambio de datos. El sitio actual no realiza ventas ni intercambios para publicidad entre contextos que deban desactivarse; esto se mantiene cuando hay una señal GPC. Si se incorpora un tratamiento aplicable, se respetará la señal de exclusión exigida por ley y se actualizarán los controles y el aviso.',
          'Si se añaden herramientas de analítica o publicidad, este aviso describirá las herramientas, datos, finalidades, conservación y opciones antes de activarlas. Se proporcionará el consentimiento o mecanismo de exclusión que exija la ley. También puedes revisar las opciones de cookies y privacidad de tu navegador.',
        ],
      },
      {
        id: 'sale-sharing', title: 'Venta, intercambio publicitario y datos sensibles',
        paragraphs: [
          'A través del sitio actual, Artimex no vende datos personales ni los comparte para publicidad conductual entre contextos. Las comunicaciones necesarias para alojamiento, seguridad o atención de consultas se describen por separado arriba.',
          'El sitio no utiliza información personal sensible para inferir características de visitantes ni para publicidad. Si envías voluntariamente datos sensibles, limítalos a lo necesario para tu consulta. Los derechos de California para restringir ciertos usos de datos sensibles se aplican cuando la ley lo exige.',
        ],
      },
      {
        id: 'california', title: 'Derechos de privacidad en California',
        paragraphs: [
          'La California Online Privacy Protection Act (CalOPPA) aborda la transparencia sobre información del sitio, destinatarios, opciones de privacidad y cambios de aviso. Esta página describe esas prácticas para el sitio actual.',
          'Cuando la California Consumer Privacy Act (CCPA), modificada por la California Privacy Rights Act (CPRA), se aplica a Artimex y a los datos en cuestión, los residentes de California pueden ejercer los derechos siguientes. La cobertura de la CCPA depende de criterios legales; publicar este aviso no significa que todas sus disposiciones se apliquen a cada interacción con Artimex.',
        ],
        bullets: [
          'Conocer y acceder a las categorías y datos personales específicos, sus fuentes, finalidades y destinatarios, y obtener una copia portátil cuando corresponda.',
          'Solicitar corrección de datos inexactos o eliminación, con las excepciones legales aplicables.',
          'Excluirse de la venta o del intercambio para publicidad conductual entre contextos, incluso mediante una señal de preferencia válida.',
          'Limitar determinados usos y comunicaciones de datos personales sensibles cuando corresponda.',
          'Recibir un trato igualitario al ejercer derechos de privacidad aplicables.',
        ],
        closing: [
          'Cuando se aplica la ley Shine the Light de California, también puedes solicitar información sobre comunicaciones a terceros para su propio marketing directo. Utiliza el contacto de privacidad indicado abajo.',
          'Las categorías y fuentes descritas en este aviso corresponden al sitio y a las consultas iniciadas a través de él. Una solicitud puede preguntar por el período retrospectivo exigido por ley y otros registros relevantes de Artimex; no se limita a tu visita más reciente.',
        ],
        links: [['California Privacy Protection Agency', 'https://cppa.ca.gov/faq.html'], ['Ley de privacidad en línea de California', 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=BPC&sectionNum=22575.']],
      },
      {
        id: 'us-rights', title: 'Otros residentes de Estados Unidos y comunicaciones',
        paragraphs: [
          'Las leyes estatales de privacidad varían en alcance, excepciones y derechos. Cuando una ley que cubre tu estado, Artimex y el tratamiento los reconoce, puedes solicitar acceso, corrección, eliminación o portabilidad; excluirte de publicidad dirigida, venta o ciertos perfiles de importancia; retirar un consentimiento cuando corresponda; o apelar una solicitud denegada.',
          'Para apelar, escribe al mismo contacto de privacidad con el asunto "Apelación de privacidad," identifica la solicitud y explica por qué pides su revisión. Evaluaremos la apelación según la ley aplicable y explicaremos el resultado. También puedes contactar al fiscal general de tu estado u otra autoridad competente.',
          'Si recibes un correo de marketing de Artimex, puedes utilizar su mecanismo de baja o escribirnos para dejar de recibir marketing. Las solicitudes de baja de correo comercial se atenderán en el plazo exigido por CAN-SPAM, como máximo en 10 días hábiles. Las respuestas necesarias a consultas y las comunicaciones transaccionales se tratan por separado.',
        ],
        links: [['Información de la FTC sobre correo comercial', 'https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business']],
      },
      {
        id: 'privacy-rights', title: 'Cómo presentar una solicitud de privacidad',
        paragraphs: [
          'Escribe a sales@artimex.com con el asunto "Solicitud de privacidad Artimex," llama al 562-777-0924 o envía correo postal a Artimex Bakery Sales Department, 12764 Florence Avenue, Santa Fe Springs, CA 90670, Estados Unidos. Indica la acción que solicitas y un medio de respuesta. No necesitas una cuenta en el sitio.',
          'Podemos pedir información razonablemente necesaria para verificar solicitudes de acceso, corrección o eliminación y proteger los datos de otras personas. Un representante autorizado puede tener que demostrar su representación y, cuando corresponda, obtener tu confirmación directa. Evita enviar documentos de identidad o identificadores sensibles salvo que expliquemos por qué son necesarios y cómo proporcionarlos adecuadamente.',
          'Los plazos y excepciones siguen la ley aplicable. Para solicitudes cubiertas por la CCPA de conocer, corregir o eliminar, se acusa recibo en 10 días hábiles y la respuesta sustantiva se entrega generalmente en 45 días naturales. Se explicará una prórroga permitida de hasta 45 días adicionales. Las exclusiones de venta o intercambio y las limitaciones de datos sensibles aplicables se atienden tan pronto como sea posible y en un máximo de 15 días hábiles.',
          'Una exclusión publicitaria no exige la misma verificación de identidad que una solicitud de divulgar datos personales. Si no podemos atender una solicitud, explicaremos la razón aplicable y las opciones de apelación disponibles. Las solicitudes suelen ser gratuitas, salvo cuando la ley permite un cobro.',
        ],
      },
      {
        id: 'children', title: 'Privacidad de menores',
        paragraphs: [
          'Este sitio ofrece información general sobre productos y negocios y no está dirigido a menores de 13 años. No solicitamos conscientemente datos personales de menores de 13 años a través de él. Una madre, padre o tutor que crea que se enviaron datos de un menor a Artimex puede contactarnos para solicitar su revisión y eliminación según corresponda.',
          'El sitio actual no vende ni comparte datos de menores para publicidad. Si un servicio futuro se dirige a menores o incorpora un uso regulado de sus datos, deberán atenderse los requisitos adicionales, incluidas las protecciones COPPA aplicables y las protecciones de California para menores, antes de ese uso.',
        ],
        links: [['Recursos de la FTC sobre privacidad de menores', 'https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy']],
      },
      {
        id: 'updates', title: 'Cambios a este aviso',
        paragraphs: [
          'Publicaremos aquí las versiones actualizadas con su fecha de vigencia y última actualización. Los cambios sustanciales se destacarán en esta página o se comunicarán de otra forma cuando lo exija la ley. Las nuevas finalidades, herramientas o puntos de recopilación se acompañarán del aviso y las opciones que correspondan al tratamiento.',
          'Contacta a Artimex si tienes preguntas sobre este aviso, los datos asociados a una consulta o tus opciones. Este aviso no elimina derechos ni protecciones reconocidos por la ley aplicable.',
        ],
      },
    ],
  },
};
