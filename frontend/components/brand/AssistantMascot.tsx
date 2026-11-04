"use client";

import { motion, useInView, useTransform, type MotionValue } from "motion/react";
import { useId, useRef } from "react";

import { useLite } from "@/lib/theme/use-lite";

interface AssistantMascotProps {
  /**
   * Para onde o olhar vai, de -1 a 1 em cada eixo (0 é olhar de frente; o par fica dentro de um círculo de raio 1). Quem usa o
   * personagem o move (o mouse, a conversa); cada pupila se acomoda no centro do seu olho e anda a mesma distância para todo lado.
   */
  eyeX: MotionValue<number>;
  eyeY: MotionValue<number>;
  /** As pernas (a terceira faixa e os pés) só aparecem depois do clique: descem de baixo do corpo. */
  legs: boolean;
  /** Quanto do olho fica coberto pela pálpebra de baixo, de 0 (olhos bem abertos) a 1: perto de 0,4 é o olhar calmo, meio cortado por baixo (como quem sorri com os olhos, sem cara de bravo). */
  lids?: number;
  /** Sem nenhum movimento próprio (não flutua, não pisca, aparece de uma vez): para o ERP, onde ele só acompanha o chat. */
  quiet?: boolean;
  /** Enquanto ele "fala", as três faixas do corpo pulsam em onda. */
  talking: boolean;
  className?: string;
}

const EASE = [0.22, 1, 0.36, 1] as const;

// O logo do assistente (`public/brand/ai_logo.svg`), em partes para mexer em cada uma. Quadro cortado rente ao desenho.
const VIEW_BOX = "640 320 1120 1310";
const BODY = "M1729.5 1185 L670 1185 L670.384 863.948 L670.467 794.426 C670.475 787.979 669.428 772.848 670.5 767 C676.779 732.729 701.65 719.075 727.524 699.185 L777.969 660.406 L960.362 520.194 L1107.066 407.417 L1150.72 373.858 C1176.149 354.311 1194.212 337.956 1227 355.5 C1239.48 362.177 1267.243 385.834 1278.551 394.579 L1487.812 556.4 C1540.866 597.427 1593.786 638.686 1647 679.5 C1664.749 693.113 1682.863 706.397 1700.765 719.823 C1703.01 721.508 1715.792 730.358 1717 732 C1720.444 736.68 1725.719 745.811 1727.5 751 C1732.545 765.695 1730.444 788.675 1730.408 803.76 L1730.232 877.552 Z M1590 802 C1588.699 796.796 1571.053 781.97 1565.417 777.542 C1508.876 733.117 1425.132 729.818 1366.366 771.977 C1362.922 774.447 1351 780.97 1351 785 C1346.915 786.021 1344.078 790.869 1341.306 793.894 C1338.598 796.848 1339.458 796.838 1336 798 C1331.021 799.674 1309.903 839.995 1307 845.5 C1305.272 844.924 1285.586 806.94 1279 801 C1272.586 795.216 1271.336 793.277 1265.5 787 C1250.548 770.92 1216.166 753.112 1195 747.5 C1145.338 734.332 1091.485 746.136 1050.676 776.743 C1047.388 779.209 1037 784.992 1037 789 L1035 789 L1035 791 C1028.307 792.673 1013.953 815.79 1010.042 821.439 C991.893 847.654 984.167 880.675 984.954 912.151 C985.348 927.932 985.255 938.473 989.5 954 C1012.726 1038.947 1099.255 1089.449 1184.668 1072.366 C1203.693 1068.561 1218.984 1064.406 1236 1054.5 C1255.235 1043.302 1275.385 1024.954 1288.5 1007 C1295.198 997.831 1299.388 985.382 1308 978 C1309.281 985.685 1330.579 1016.247 1336.5 1022 C1337.715 1023.181 1345.912 1029.306 1346 1030 C1346.075 1030.593 1345.964 1031.374 1346 1032 C1346.036 1032.631 1349.531 1034.613 1350.018 1034.974 L1362.314 1044.072 C1372.18 1051.373 1390.528 1063.426 1401 1067.5 C1405.794 1069.365 1421.604 1071.007 1427.431 1071.999 C1483.087 1081.472 1531.947 1071.855 1575 1033.5 C1580.979 1028.174 1587.262 1021.748 1591.905 1015.193 L1597 1008 C1597.587 1007.932 1598.461 1008.099 1599 1008 C1599.74 1007.864 1602.354 1000.716 1603.5 1000 C1604.007 999.683 1605.361 999.255 1606 999 C1605.312 996.249 1619.734 969 1621.5 964 C1635.603 924.061 1632.769 876.538 1613.811 838.623 C1610.339 831.679 1594.511 802 1590 802 Z";
// O vão dos olhos (o furo do corpo): as pupilas só aparecem dentro dele.
const EYES = "M1590 802 C1588.699 796.796 1571.053 781.97 1565.417 777.542 C1508.876 733.117 1425.132 729.818 1366.366 771.977 C1362.922 774.447 1351 780.97 1351 785 C1346.915 786.021 1344.078 790.869 1341.306 793.894 C1338.598 796.848 1339.458 796.838 1336 798 C1331.021 799.674 1309.903 839.995 1307 845.5 C1305.272 844.924 1285.586 806.94 1279 801 C1272.586 795.216 1271.336 793.277 1265.5 787 C1250.548 770.92 1216.166 753.112 1195 747.5 C1145.338 734.332 1091.485 746.136 1050.676 776.743 C1047.388 779.209 1037 784.992 1037 789 L1035 789 L1035 791 C1028.307 792.673 1013.953 815.79 1010.042 821.439 C991.893 847.654 984.167 880.675 984.954 912.151 C985.348 927.932 985.255 938.473 989.5 954 C1012.726 1038.947 1099.255 1089.449 1184.668 1072.366 C1203.693 1068.561 1218.984 1064.406 1236 1054.5 C1255.235 1043.302 1275.385 1024.954 1288.5 1007 C1295.198 997.831 1299.388 985.382 1308 978 C1309.281 985.685 1330.579 1016.247 1336.5 1022 C1337.715 1023.181 1345.912 1029.306 1346 1030 C1346.075 1030.593 1345.964 1031.374 1346 1032 C1346.036 1032.631 1349.531 1034.613 1350.018 1034.974 L1362.314 1044.072 C1372.18 1051.373 1390.528 1063.426 1401 1067.5 C1405.794 1069.365 1421.604 1071.007 1427.431 1071.999 C1483.087 1081.472 1531.947 1071.855 1575 1033.5 C1580.979 1028.174 1587.262 1021.748 1591.905 1015.193 L1597 1008 C1597.587 1007.932 1598.461 1008.099 1599 1008 C1599.74 1007.864 1602.354 1000.716 1603.5 1000 C1604.007 999.683 1605.361 999.255 1606 999 C1605.312 996.249 1619.734 969 1621.5 964 C1635.603 924.061 1632.769 876.538 1613.811 838.623 C1610.339 831.679 1594.511 802 1590 802 Z";
const PUPIL_LEFT = "M1106 890.5 C1117.403 892.781 1128.919 895.226 1139 901.5 C1141.653 903.151 1146.796 908.453 1149.358 910.738 C1205.031 960.392 1163.431 1051.366 1089 1043.5 C1008.887 1035.034 997.489 919.898 1072 894.5 C1083.08 890.723 1094.494 890.5 1106 890.5 Z";
const PUPIL_RIGHT = "M1418 890.5 C1428.798 892.66 1437.122 894.09 1447 899.5 C1462.1 907.77 1472.076 920.344 1478.707 935.816 C1502.84 992.127 1460.344 1050.987 1399 1043.5 C1323.629 1034.301 1309.19 928.34 1376 897.5 C1390.377 890.864 1402.626 890.5 1418 890.5 Z";
// As três faixas: as duas primeiras inteiras; a terceira vem partida em dois pés.
const BAR_TOP = "M670 1240 L1729 1240.5 L1729.5 1276 L1023.646 1276.336 L792.315 1276.446 C752.046 1276.466 710.166 1278.008 670 1276 L672 1275 C668.516 1270.355 670.108 1247.158 670 1240 Z";
const BAR_MIDDLE = "M670 1331 L1730 1331 C1730.128 1339.713 1731.827 1359.691 1730 1367 L670 1367 Z";
const FOOT_LEFT = "M1192 1421.5 L1193 1608 L996 1608 C996.412 1602.502 996.381 1592.883 997.5 1588 C1003.744 1560.741 1028.259 1539.496 1055 1533.5 C1062.934 1531.721 1082.62 1532.38 1092 1532 L1092 1457 L670.5 1456 L671 1421.5 Z";
const FOOT_RIGHT = "M1730 1421 L1730 1457 L1308 1457 L1309 1532 C1318.187 1532.372 1338.344 1531.727 1346 1533.5 C1374.2 1540.031 1399.739 1562.606 1404.5 1592 C1405.19 1596.259 1404.856 1603.379 1405 1608 L1207 1608 L1208 1421.5 Z";

// As pupilas, medidas no desenho: o olho esquerdo é centrado em x 1147 e o direito em x 1470 (ambos em y 909), cada um com ~163 de raio;
// as pupilas são círculos de raio ~76 e o logo as desenha deslocadas, olhando para baixo. Daí o quanto cada uma precisa andar para
// ficar no centro do olho, e quanto pode andar dali sem sair dele (nem passar para o outro olho).
const LEFT_CENTERING = { x: 48, y: -58 };
const RIGHT_CENTERING = { x: 61, y: -58 };
const TRAVEL = 74;

// A caixa que cobre os dois olhos: o branco fica atrás do corpo e a pálpebra desce por cima.
const EYE_BOX = { x: 975, y: 725, width: 665, height: 355 } as const;

/**
 * O personagem do Assistente: o logo da casinha de olhos arregalados, na cor laranja do site. Ao chegar à tela ele sobe e aparece uma
 * vez; depois flutua devagar e pisca de tempos em tempos, e as pupilas vão aonde `eyeX`/`eyeY` mandam (suavizadas por quem as
 * controla). Quando `talking`, as faixas pulsam em onda. Só desenho: sem texto (quem o usa diz o que ele é). No modo lite fica parado.
 */
export function AssistantMascot({ eyeX, eyeY, legs, talking, lids = 0, quiet = false, className }: AssistantMascotProps) {
  const lite = useLite();
  const still = lite || quiet;
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const on = still || seen;
  const leftX = useTransform(eyeX, (look) => LEFT_CENTERING.x + look * TRAVEL);
  const leftY = useTransform(eyeY, (look) => LEFT_CENTERING.y + look * TRAVEL);
  const rightX = useTransform(eyeX, (look) => RIGHT_CENTERING.x + look * TRAVEL);
  const rightY = useTransform(eyeY, (look) => RIGHT_CENTERING.y + look * TRAVEL);
  const eyesClip = `eyes-${useId().replace(/:/g, "")}`;

  /** A faixa `index` some um pouco e volta quando o personagem fala, cada uma depois da outra: uma onda de cima para baixo. */
  const pulse = (index: number) => ({
    animate: { opacity: talking && !still ? [1, 0.45, 1] : 1 },
    transition:
      talking && !still
        ? { duration: 0.7, delay: index * 0.12, repeat: Infinity, ease: "easeInOut" as const }
        : { duration: 0.3 },
  });

  return (
    <motion.div
      ref={ref}
      initial={false}
      animate={{ opacity: on ? 1 : 0, y: on ? 0 : 28 }}
      transition={{ duration: still ? 0 : 0.9, ease: EASE }}
      className={className}
    >
      <svg viewBox={VIEW_BOX} aria-hidden className="block h-auto w-full" overflow="visible">
        <defs>
          <clipPath id={eyesClip}>
            <path d={EYES} />
          </clipPath>
        </defs>

        {/* A sombra fica sob os pés; sem as pernas, sobe para baixo do corpo. */}
        <motion.ellipse
          cx="1200"
          rx="470"
          ry="26"
          fill="var(--color-ink)"
          opacity="0.12"
          initial={false}
          animate={{ cy: legs ? 1632 : 1410 }}
          transition={{ duration: still ? 0 : 0.7, ease: EASE }}
        />

        {/* Flutua: sobe e desce devagar. */}
        <motion.g
          animate={still ? { y: 0 } : { y: [0, -14, 0] }}
          transition={still ? { duration: 0 } : { duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* O branco dos olhos: fica atrás do corpo e aparece só pelo furo. */}
          <rect {...EYE_BOX} fill="var(--color-brand-foreground)" />
          <path d={BODY} fill="var(--color-brand)" />

          {/* As pupilas, só dentro do vão dos olhos. A cor é a da faixa escura do site, que é escura nos dois modos. */}
          <g clipPath={`url(#${eyesClip})`}>
            <motion.path d={PUPIL_LEFT} fill="var(--color-band)" style={{ x: leftX, y: leftY }} />
            <motion.path d={PUPIL_RIGHT} fill="var(--color-band)" style={{ x: rightX, y: rightY }} />
          </g>

          {/* A pálpebra de baixo, fixa: sobe do pé dos olhos e cobre um pedaço, para o olhar calmo e simpático (uma pálpebra de cima
              passaria por bravo). Anima a posição e a altura, sempre ancorada embaixo. */}
          <motion.rect
            x={EYE_BOX.x}
            width={EYE_BOX.width}
            fill="var(--color-brand)"
            initial={false}
            animate={{ y: EYE_BOX.y + EYE_BOX.height * (1 - lids), height: EYE_BOX.height * lids }}
            transition={{ duration: lite ? 0 : 0.35, ease: EASE }}
          />

          {/* A pálpebra, da cor do corpo: desce do alto dos olhos e sobe de volta (a altura, sem escalar, para a origem ser sempre o topo). */}
          {!still && (
            <motion.rect
              x={EYE_BOX.x}
              y={EYE_BOX.y}
              width={EYE_BOX.width}
              fill="var(--color-brand)"
              initial={{ height: 0 }}
              animate={on ? { height: [0, 0, EYE_BOX.height, 0, 0] } : { height: 0 }}
              transition={{ duration: 4.6, times: [0, 0.9, 0.935, 0.97, 1], ease: "easeInOut", repeat: Infinity, delay: 1.6 }}
            />
          )}

          <motion.path d={BAR_TOP} fill="var(--color-brand)" {...pulse(0)} />
          <motion.path d={BAR_MIDDLE} fill="var(--color-brand)" {...pulse(1)} />
          {/* As pernas descem de baixo do corpo (a segunda faixa fica na frente delas) ao clicar. */}
          <motion.g
            initial={false}
            animate={{ y: legs ? 0 : -150, opacity: legs ? 1 : 0 }}
            transition={{ duration: still ? 0 : 0.6, delay: legs && !still ? 0.12 : 0, ease: EASE }}
          >
            <motion.path d={FOOT_LEFT} fill="var(--color-brand)" {...pulse(2)} />
            <motion.path d={FOOT_RIGHT} fill="var(--color-brand)" {...pulse(2)} />
          </motion.g>
        </motion.g>
      </svg>
    </motion.div>
  );
}
