import { getTokenPayload } from "../helpers.js";
import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../prisma.js";
import {
	extractExcelData,
	writeExcelFilewithSubheader2,
} from "../services/export.service.js";

// const prisma = new PrismaClient();

const GENDER = {
	Putra: "L",
	Putri: "P",
};

const JENJANG = {
	SMP: 1,
	SMA: 2,
};

export class NilaiKarakterController {
	static getAllNilaiKarakter = async (req, res, next) => {
		try {
			const { groupbyclass, class: className, type, cat, bulan } = req.query;
			const { semester, tahunAjaran } = await getTokenPayload(req);
			// console.log(className)

			const rombelWhereClause = { id_tahun_ajaran: tahunAjaran.id };
			if (className) {
				// className format className-gender

				const classname = className.split("-")[0];
				const gender = className.split("-")[1];

				// const {classname, gender} = [parts[0] || "all" , parts[1] ];

				const ruanganKelas = await prisma.ref_kelas.findFirst({
					where: {
						kelas: classname,
						gender: gender,
					},
				});
				if (!ruanganKelas) {
					return next(new AppError("Kelas tidak ditemukan", 404));
				}
				rombelWhereClause["id_kelas"] = parseInt(ruanganKelas.id);
			}

			const rombels = await prisma.data_rombel.findMany({
				where: rombelWhereClause,
				include: {
					data_rombel_anggota: {
						select: {
							id_santri: true,
						},
					},
					ref_kelas: true,
				},
			});

			const santriDatas = [];

			for (const rombel of rombels) {
				const santriIds = rombel.data_rombel_anggota.map(
					(anggota) => anggota.id_santri
				);

				const santriList = await prisma.santri.findMany({
					where: {
						id: {
							in: santriIds,
						},
					},
					select: { id: true, nis: true, nama: true },
				});

				const santriMap = santriList.reduce((acc, santri) => {
					acc[santri.id] = santri;
					return acc;
				}, {});

				const karakterWhereClause = {
					id_santri: {
						in: santriIds,
					},
					id_semester: semester.id,
					id_tahun_ajaran: tahunAjaran.id,
				};

				if (type && type !== "all") {
					if (type === "asrama") {
						karakterWhereClause.id_basis_lokasi = 25;
					} else if (type === "sekolah") {
						karakterWhereClause.id_basis_lokasi = 26;
					}
				}

				if (bulan && bulan !== "all") {
					karakterWhereClause.bulan = parseInt(bulan);
				}

				if (cat && cat !== "all") {
					const kelompokKarakter = await prisma.ref_karakter_kategori.findFirst(
						{
							where: {
								nama: cat,
							},
							include: {
								ref_kriteria_karakter: {
									where: {
										is_aktif: true,
									},
								},
							},
						}
					);
					if (kelompokKarakter && kelompokKarakter.ref_kriteria_karakter) {
						// const kriteriaList =
						// 	kelompokKarakter.ref_kriteria_karakter.map((k) => ({
						// 		id: k.id,
						// 	}));
						// karakterWhereClause.id_kriteria = {
						// 	in: kriteriaList.map((k) => k.id),
						// };
						karakterWhereClause.id_kriteria = {
							in: kelompokKarakter.ref_kriteria_karakter.map((k) => k.id),
						};
					} else {
						karakterWhereClause.id_kriteria = { in: [] };
					}
				}

				const nilaiKatakterList = await prisma.data_nilai_karakter.findMany({
					where: karakterWhereClause,
					include: {
						ref_kriteria_karakter: {
							include: {
								ref_karakter_kategori: true,
							},
						},
					},
				});

				const nilaiMap = nilaiKatakterList.reduce((acc, item) => {
					if (!acc[item.id_santri]) {
						acc[item.id_santri] = {
							minggu: {},
						};
					}

					if (!acc[item.id_santri].minggu[item.minggu]) {
						acc[item.id_santri].minggu[item.minggu] = {
							minggu: item.minggu,
							bulan: item.bulan,
							nilai_list: [],
							total_nilai: 0,
							rata_rata: 0,
						};
					}

					const nilaiData = {
						id: item.id,
						karakter: item.ref_kriteria_karakter.nama,
						kategori: item.ref_kriteria_karakter.ref_karakter_kategori.nama,
						nilai: item.nilai,
					};

					acc[item.id_santri].minggu[item.minggu].nilai_list.push(nilaiData);

					const mingguData = acc[item.id_santri].minggu[item.minggu];
					mingguData.total_nilai = mingguData.nilai_list.reduce(
						(sum, n) => sum + n.nilai,
						0
					);
					mingguData.rata_rata =
						mingguData.total_nilai / mingguData.nilai_list.length;

					return acc;
				}, {});

				const simplifiedStudents = rombel.data_rombel_anggota
					.filter((anggota) => santriMap[anggota.id_santri])
					.map((anggota) => ({
						id: santriMap[anggota.id_santri].id,
						nis: santriMap[anggota.id_santri].nis,
						nama: santriMap[anggota.id_santri].nama,
						kelas: rombel.nama,
						nilai_karakter: nilaiMap[anggota.id_santri] || {
							minggu: {},
						},
						total_nilai: Object.values(
							nilaiMap[anggota.id_santri]?.minggu || {}
						).reduce((sum, minggu) => sum + minggu.total_nilai, 0),
						rata_rata:
							Object.values(nilaiMap[anggota.id_santri]?.minggu || {}).reduce(
								(sum, minggu) => sum + minggu.rata_rata,
								0
							) /
							(Object.keys(nilaiMap[anggota.id_santri]?.minggu || {}).length ||
								1),
					}));

				santriDatas.push({
					class_id: rombel.id,
					class: rombel.ref_kelas.kelas,
					students: simplifiedStudents,
				});
			}
			if (groupbyclass === "true") {
				const sortedData = santriDatas.map((rombel) => {
					rombel.students.sort((a, b) => a.nama.localeCompare(b.nama));
					return rombel;
				});
				return res.status(200).json(sortedData);
			} else {
				const flatList = santriDatas.flatMap((item) => item.students);

				const sortedFlatList = flatList.sort((a, b) =>
					a.nama.localeCompare(b.nama)
				);
				return res.status(200).json(sortedFlatList);
			}
		} catch (error) {
			next(new AppError(error.message, 500));
		}
	};

	static getRangkingNilaiKarakter = async (req, res, next) => {
		try {
			const { jenjang, gender, tipe } = req.query;
			const { semester, tahunAjaran } = await getTokenPayload(req);

			const normalizedJenjang = jenjang ? jenjang.toUpperCase() : null;
			const normalizedGender = gender ? gender.toUpperCase() : null;

			const karakterWhereClause = {
				// id_santri: {
				// 	in: santriIds,
				// },
				id_semester: semester.id,
				id_tahun_ajaran: tahunAjaran.id,
				santri: {
					id_jenjang: normalizedJenjang	
						? JENJANG[normalizedJenjang]
						: undefined,
					jk: normalizedGender ? GENDER[normalizedGender] : undefined,
				},
			};
			
			if (tipe && tipe !== "all") {
				if (tipe === "asrama") {
					karakterWhereClause.id_basis_lokasi = 25;
				} else if (tipe === "sekolah") {
					karakterWhereClause.id_basis_lokasi = 26;
				}
			}

			const nilaiKatakterList = await prisma.data_nilai_karakter.groupBy({
				by: ["id_santri"],
				where: karakterWhereClause,
				_sum: {
					nilai: true,
				},
				orderBy: {
					_sum: {
						nilai: "desc",
					},
				},
				take: 3,
			});

			const santriIds = nilaiKatakterList.map((item) => item.id_santri);
			const santriList = await prisma.santri.findMany({
				where: {
					id: { in: santriIds },
				},
				select: {
					id: true,
					nis: true,
					nama: true,
				},
			});
			const santriMap = santriList.reduce((acc, santri) => {
				acc[santri.id] = santri;
				return acc;
			}, {});

			const nilaiRankMap = nilaiKatakterList.reduce((acc, item, index) => {
				const santri = santriMap[item.id_santri] || {};
				acc[index + 1] = {
					id: santri.id,
					nis: santri.nis,
					nama: santri.nama,
					total_nilai: item._sum.nilai,
				};
				return acc;
			}, {});
			// const rangkingMap = nilaiKatakterList.reduce((acc, item) => {
			// console.log(nilaiKatakterList);
			return res.status(200).json({
				success: true,
				message: "Rangking santri berhasil diambil",
				data: nilaiRankMap,
			});
		} catch (error) {
			next(new AppError(error.message, 500));
		}
	};

	static getModalData = async (req, res, next) => {
		try {
			const { id_rombel } = req.params;
			const { type, cat, pekan, bulan } = req.query;
			const { semester, tahunAjaran } = await getTokenPayload(req);

			if (!id_rombel) {
				return next(new AppError("params id_rombel tidak boleh kosong", 400));
			}

			const rombelWhereClause = { id: parseInt(id_rombel) };

			const rombel = await prisma.data_rombel.findFirst({
				where: rombelWhereClause,
				include: {
					data_rombel_anggota: {
						select: {
							id_santri: true,
						},
					},
					ref_kelas: true,
				},
			});

			// console.log(rombel);

			const santriIds = rombel.data_rombel_anggota.map(
				(anggota) => anggota.id_santri
			);

			const santriList = await prisma.santri.findMany({
				where: {
					id: {
						in: santriIds,
					},
				},
				select: { id: true, nis: true, nama: true },
			});
			// pass data santrilist to excel template generator
			// const nilaiKatakterList =
			// 	await prisma.data_nilai_karakter.findMany({

			const karakterWhereClause = {};
			if (type && type !== "all") {
				if (type === "asrama") {
					karakterWhereClause.id_basis_lokasi = 25;
				} else if (type === "sekolah") {
					karakterWhereClause.id_basis_lokasi = 26;
				}
			}

			if (cat && cat !== "all") {
				const kelompokKarakter = await prisma.ref_karakter_kategori.findFirst({
					where: {
						nama: cat,
					},
					include: {
						ref_kriteria_karakter: {
							where: {
								is_aktif: true,
							},
						},
					},
				});
				// console.log(kelompokKarakter);
				if (kelompokKarakter && kelompokKarakter.ref_kriteria_karakter) {
					// const kriteriaList =
					// 	kelompokKarakter.ref_kriteria_karakter.map((k) => ({
					// 		id: k.id,
					// 	}));
					// karakterWhereClause.id_kriteria = {
					// 	in: kriteriaList.map((k) => k.id),
					// };
					// console.log(kelompokKarakter.ref_kriteria_karakter.map((k) => (k.id)))
					karakterWhereClause.id = {
						in: kelompokKarakter.ref_kriteria_karakter.map((k) => k.id),
					};
				} else {
					karakterWhereClause.id = { in: [] };
				}

				// karakterWhereClause.is_aktif = true;
			}
			const kriteria_karakter = await prisma.ref_kriteria_karakter.findMany({
				where: karakterWhereClause,
				include: {
					ref_karakter_kategori: true,
					ref_master_kategori: true,
				},
			});

			const header = kriteria_karakter.map((item) => ({
				id: item.id,
				kategori: item.ref_karakter_kategori.nama,
				nama: item.nama,
				deskripsi: item.deskripsi,
				basis: item.ref_master_kategori.nama,
			}));

			karakterWhereClause.id_santri = {
				in: santriIds,
			};
			karakterWhereClause.id_kriteria = {
				in: kriteria_karakter.map((k) => k.id),
			};
			karakterWhereClause.id_semester = semester.id;
			karakterWhereClause.id_tahun_ajaran = tahunAjaran.id;
			if (!pekan) {
				return next(new AppError("query pekan tidak boleh kosong", 400));
			}
			// if (pekan && pekan !== "all") {
			karakterWhereClause.minggu = parseInt(pekan);
			// }
			if (bulan && bulan !== "all") {
				karakterWhereClause.bulan = parseInt(bulan);
			}
			// console.log(karakterWhereClause);
			delete karakterWhereClause.id;

			const nilaiSantri = await prisma.data_nilai_karakter.findMany({
				where: karakterWhereClause,
				include: {
					ref_kriteria_karakter: {
						include: {
							ref_karakter_kategori: true,
						},
					},
					santri: true,
				},
			});

			const nilaiMap = nilaiSantri.map((item) => ({
				id: item.id,
				id_santri: item.id_santri,
				// nama_santri: item.santri.nama,
				nis_santri: item.santri.nis,
				nama_santri: item.santri.nama,
				karakter: item.ref_kriteria_karakter.nama,
				karakter_id: item.ref_kriteria_karakter.id,
				kategori: item.ref_kriteria_karakter.ref_karakter_kategori.nama,
				nilai: item.nilai,
				// bulan: item.bulan,
				minggu: item.minggu,
			}));

			const groupedNilaiMap = [];
			santriList.forEach((santri) => {
				const nilaiSantri = nilaiMap
					.filter((n) => n.id_santri === santri.id)
					.map((n) => ({
						id: n.id,
						karakter_id: n.karakter_id,
						karakter: n.karakter,
						nilai: n.nilai,
					}));
				groupedNilaiMap.push({
					id_santri: santri.id,
					nis_santri: santri.nis,
					nama_santri: santri.nama,
					nilai: nilaiSantri,
				});
			});

			// const rowData = {...groupedNilaiMap };

			return res.status(200).json({
				header,
				rowData : groupedNilaiMap,
			});
		} catch (error) {
			next(new AppError(error.message, 500));
		}
	};

	static getRombelDetail = async (req, res, next) => {
		try {
			const { class: className, type, cat, pekan, bulan } = req.query;
			const { semester, tahunAjaran } = await getTokenPayload(req);

			if (!className) {
				return next(new AppError("query class tidak boleh kosong", 400));
			}

			const rombelWhereClause = { id_tahun_ajaran: tahunAjaran.id };
			const ruanganKelas = await prisma.ref_kelas.findFirst({
				where: {
					kelas: className,
				},
			});
			rombelWhereClause["id_kelas"] = parseInt(ruanganKelas.id);

			const rombel = await prisma.data_rombel.findFirst({
				where: rombelWhereClause,
				include: {
					data_rombel_anggota: {
						select: {
							id_santri: true,
						},
					},
					ref_kelas: true,
				},
			});

			// console.log(rombel);

			const santriIds = rombel.data_rombel_anggota.map(
				(anggota) => anggota.id_santri
			);

			const santriList = await prisma.santri.findMany({
				where: {
					id: {
						in: santriIds,
					},
				},
				select: { id: true, nis: true, nama: true },
			});
			// pass data santrilist to excel template generator
			// const nilaiKatakterList =
			// 	await prisma.data_nilai_karakter.findMany({

			const karakterWhereClause = {};
			if (type && type !== "all") {
				if (type === "asrama") {
					karakterWhereClause.id_basis_lokasi = 25;
				} else if (type === "sekolah") {
					karakterWhereClause.id_basis_lokasi = 26;
				}
			}

			if (cat && cat !== "all") {
				const kelompokKarakter = await prisma.ref_karakter_kategori.findFirst({
					where: {
						nama: cat,
					},
					include: {
						ref_kriteria_karakter: {
							where: {
								is_aktif: true,
							},
						},
					},
				});
				// console.log(kelompokKarakter);
				if (kelompokKarakter && kelompokKarakter.ref_kriteria_karakter) {
					// const kriteriaList =
					// 	kelompokKarakter.ref_kriteria_karakter.map((k) => ({
					// 		id: k.id,
					// 	}));
					// karakterWhereClause.id_kriteria = {
					// 	in: kriteriaList.map((k) => k.id),
					// };
					// console.log(kelompokKarakter.ref_kriteria_karakter.map((k) => (k.id)))
					karakterWhereClause.id = {
						in: kelompokKarakter.ref_kriteria_karakter.map((k) => k.id),
					};
				} else {
					karakterWhereClause.id = { in: [] };
				}

				// karakterWhereClause.is_aktif = true;
			}
			const kriteria_karakter = await prisma.ref_kriteria_karakter.findMany({
				where: karakterWhereClause,
				include: {
					ref_karakter_kategori: true,
					ref_master_kategori: true,
				},
			});

			const header = kriteria_karakter.map((item) => ({
				id: item.id,
				kategori: item.ref_karakter_kategori.nama,
				nama: item.nama,
				deskripsi: item.deskripsi,
				basis: item.ref_master_kategori.nama,
			}));

			// console.log(groupHeader);

			karakterWhereClause.id_santri = {
				in: santriIds,
			};
			karakterWhereClause.id_kriteria = {
				in: kriteria_karakter.map((k) => k.id),
			};
			karakterWhereClause.id_semester = semester.id;
			karakterWhereClause.id_tahun_ajaran = tahunAjaran.id;
			if (!pekan) {
				return next(new AppError("query pekan tidak boleh kosong", 400));
			}
			// if (pekan && pekan !== "all") {
			karakterWhereClause.minggu = parseInt(pekan);
			// }
			if (bulan && bulan !== "all") {
				karakterWhereClause.bulan = parseInt(bulan);
			}
			// console.log(karakterWhereClause);
			delete karakterWhereClause.id;

			const nilaiSantri = await prisma.data_nilai_karakter.findMany({
				where: karakterWhereClause,
				include: {
					ref_kriteria_karakter: {
						include: {
							ref_karakter_kategori: true,
						},
					},
					santri: true,
				},
			});

			const nilaiMap = nilaiSantri.map((item) => ({
				id: item.id,
				id_santri: item.id_santri,
				// nama_santri: item.santri.nama,
				nis_santri: item.santri.nis,
				nama_santri: item.santri.nama,
				karakter: item.ref_kriteria_karakter.nama,
				karakter_id: item.ref_kriteria_karakter.id,
				kategori: item.ref_kriteria_karakter.ref_karakter_kategori.nama,
				nilai: item.nilai,
				// bulan: item.bulan,
				minggu: item.minggu,
			}));

			// console.log("niliaMap",nilaiMap);
			// gabung santriList dengan nilaiMap
			// const santriMap = santriList.reduce((acc, santri) => {
			// 	acc[santri.id] = santri;
			// 	return acc;
			// }, {});
			// console.log(santriList);

			// console.log(santriListWithNilai);

			// const rowData = []

			const rowData = santriList.map((santri) => {
				const dataSantri = {
					id: santri.id,
					nis: santri.nis,
					nama: santri.nama,
				};
				header.forEach((item) => {
					const nilai = nilaiMap.find(
						(n) => n.id_santri === santri.id && n.karakter_id === item.id
					);
					const karakter_nilai = nilai ? nilai.nilai : "";
					dataSantri[item.nama] = karakter_nilai;
				});
				return dataSantri;
			});

			// const x = header.map((item) => {
			// const y = santriList.map((santri) => {
			// 	const nilai = nilaiMap.find(
			// 		(n) =>
			// 			n.id_santri === santri.id &&
			// 			n.karakter_id === item.id
			// 	);
			// 	return {
			// 		id: item.id,
			// 		nama: item.nama,
			// 		kategori: item.kategori,
			// 		nilai: nilai ? nilai.nilai : "",
			// 		// bulan: nilai ? nilai.bulan : "",
			// 		minggu: nilai ? nilai.minggu : "",
			// 		nis_santri: santri.nis,
			// 		nama_santri: santri.nama,
			// 	};
			// })
			// return {
			// 	nis: "",
			// 	nama: "",
			// }
			// });

			// console.log("data", x);
			// console.log("header", header);
			// rowData.push(...x);
			// console.log("rowData", rowData);

			// return await writeExcelFilewithSubheader(
			// 	res,
			// 	data,
			// 	"template_nilai_karakter"
			// );
			// return await writeExcelFilewithSubheader2(
			// 	res,
			// 	groupHeader,
			// 	r,
			// 	"template_nilai_karakter",
			// 	// "Data Nilai Karakter"
			// )
			return res.status(200).json({
				header,
				rowData,
			});
		} catch (error) {
			next(new AppError(error.message, 500));
		}
	};

	static generateExcelTemplate = async (req, res, next) => {
		try {
			const { class: className, type, cat, pekan, bulan } = req.query;
			const { semester, tahunAjaran } = await getTokenPayload(req);

			if (!className) {
				return next(new AppError("query class tidak boleh kosong", 400));
			}

			const rombelWhereClause = { id_tahun_ajaran: tahunAjaran.id };
			const ruanganKelas = await prisma.ref_kelas.findFirst({
				where: {
					kelas: className,
				},
			});
			rombelWhereClause["id_kelas"] = parseInt(ruanganKelas.id);

			const rombel = await prisma.data_rombel.findFirst({
				where: rombelWhereClause,
				include: {
					data_rombel_anggota: {
						select: {
							id_santri: true,
						},
					},
					ref_kelas: true,
				},
			});

			const santriIds = rombel.data_rombel_anggota.map(
				(anggota) => anggota.id_santri
			);

			const santriList = await prisma.santri.findMany({
				where: {
					id: {
						in: santriIds,
					},
				},
				select: { id: true, nis: true, nama: true },
			});
			// pass data santrilist to excel template generator
			// const nilaiKatakterList =
			// 	await prisma.data_nilai_karakter.findMany({

			const karakterWhereClause = {};
			if (type && type !== "all") {
				if (type === "asrama") {
					karakterWhereClause.id_basis_lokasi = 25;
				} else if (type === "sekolah") {
					karakterWhereClause.id_basis_lokasi = 26;
				}
			}

			if (cat && cat !== "all") {
				const kelompokKarakter = await prisma.ref_karakter_kategori.findFirst({
					where: {
						nama: cat,
					},
					include: {
						ref_kriteria_karakter: {
							where: {
								is_aktif: true,
							},
						},
					},
				});

				if (kelompokKarakter && kelompokKarakter.ref_kriteria_karakter) {
					// const kriteriaList =
					// 	kelompokKarakter.ref_kriteria_karakter.map((k) => ({
					// 		id: k.id,
					// 	}));
					// karakterWhereClause.id_kriteria = {
					// 	in: kriteriaList.map((k) => k.id),
					// };
					// console.log(kelompokKarakter.ref_kriteria_karakter.map((k) => (k.id)))
					karakterWhereClause.id = {
						in: kelompokKarakter.ref_kriteria_karakter.map((k) => k.id),
					};
				} else {
					karakterWhereClause.id = { in: [] };
				}
			}
			const kriteria_karakter = await prisma.ref_kriteria_karakter.findMany({
				where: karakterWhereClause,
				include: {
					ref_karakter_kategori: true,
					ref_master_kategori: true,
				},
			});

			const header = kriteria_karakter.map((item) => ({
				id: item.id,
				kategori: item.ref_karakter_kategori.nama,
				nama: item.nama,
				deskripsi: item.deskripsi,
				basis: item.ref_master_kategori.nama,
			}));

			const groupHeader = header.reduce((acc, item) => {
				if (!acc[item.kategori]) {
					acc[item.kategori] = {
						items: [],
						length: 0,
					};
				}
				acc[item.kategori].items.push(item);
				acc[item.kategori].length = acc[item.kategori].items.length;
				return acc;
			}, {});

			// console.log(groupHeader);

			karakterWhereClause.id_santri = {
				in: santriIds,
			};
			karakterWhereClause.id_kriteria = {
				in: kriteria_karakter.map((k) => k.id),
			};
			karakterWhereClause.id_semester = semester.id;
			karakterWhereClause.id_tahun_ajaran = tahunAjaran.id;
			if (!pekan) {
				return next(new AppError("query pekan tidak boleh kosong", 400));
			}
			// if (pekan && pekan !== "all") {
			karakterWhereClause.minggu = parseInt(pekan);
			// }
			if (bulan && bulan !== "all") {
				karakterWhereClause.bulan = parseInt(bulan);
			}
			// console.log(karakterWhereClause);
			delete karakterWhereClause.id;

			const nilaiSantri = await prisma.data_nilai_karakter.findMany({
				where: karakterWhereClause,
				include: {
					ref_kriteria_karakter: {
						include: {
							ref_karakter_kategori: true,
						},
					},
					santri: true,
				},
			});

			const nilaiMap = nilaiSantri.map((item) => ({
				id: item.id,
				id_santri: item.id_santri,
				// nama_santri: item.santri.nama,
				nis_santri: item.santri.nis,
				nama_santri: item.santri.nama,
				karakter: item.ref_kriteria_karakter.nama,
				karakter_id: item.ref_kriteria_karakter.id,
				kategori: item.ref_kriteria_karakter.ref_karakter_kategori.nama,
				nilai: item.nilai,
				// bulan: item.bulan,
				minggu: item.minggu,
			}));

			// console.log("niliaMap",nilaiMap);
			// gabung santriList dengan nilaiMap
			// const santriMap = santriList.reduce((acc, santri) => {
			// 	acc[santri.id] = santri;
			// 	return acc;
			// }, {});
			// console.log(santriList);
			// console.log(santriListWithNilai);

			// const rowData = []

			const rowData = santriList.map((santri) => {
				const dataSantri = {
					nis: santri.nis,
					nama: santri.nama,
				};
				header.forEach((item) => {
					const nilai = nilaiMap.find(
						(n) => n.id_santri === santri.id && n.karakter_id === item.id
					);

					const karakter_nilai = nilai ? nilai.nilai : "";
					dataSantri[item.nama] = karakter_nilai;
				});
				return dataSantri;
			});

			// const x = header.map((item) => {
			// const y = santriList.map((santri) => {
			// 	const nilai = nilaiMap.find(
			// 		(n) =>
			// 			n.id_santri === santri.id &&
			// 			n.karakter_id === item.id
			// 	);
			// 	return {
			// 		id: item.id,
			// 		nama: item.nama,
			// 		kategori: item.kategori,
			// 		nilai: nilai ? nilai.nilai : "",
			// 		// bulan: nilai ? nilai.bulan : "",
			// 		minggu: nilai ? nilai.minggu : "",
			// 		nis_santri: santri.nis,
			// 		nama_santri: santri.nama,
			// 	};
			// })
			// return {
			// 	nis: "",
			// 	nama: "",
			// }
			// });

			// console.log("data", x);
			// console.log("header", header);
			// rowData.push(...x);
			// console.log("rowData", rowData);

			// return await writeExcelFilewithSubheader(
			// 	res,
			// 	data,
			// 	"template_nilai_karakter"
			// );
			return await writeExcelFilewithSubheader2(
				res,
				groupHeader,
				rowData,
				`template_nilai_karakter_${className}_${type}_${cat}_pekan_${pekan}_bulan_${bulan}`
				// "Data Nilai Karakter"
			);
		} catch (error) {
			next(new AppError(error.message, 500));
		}
	};

	static editNilaiKarakter = async (req, res, next) => {
		try {
			// const { id } = req.params;
			const { bulan, minggu, id_santri, id_kriteria, nilai } = req.body;
			const { semester, tahunAjaran } = await getTokenPayload(req);

			// if (!id_santri || !minggu) {
			// 	return next(new AppError("ID dan nilai tidak boleh kosong", 400));
			// }
			// minggu, id_santri, id_kriteria, nilai harus ada di body
			if (!bulan || !minggu || !id_santri || !id_kriteria || !nilai) {
				return next(
					new AppError(
						"Bulan, minggu, id_santri, id_kriteria, dan nilai tidak boleh kosong",
						400
					)
				);
			}

			const santri = await prisma.santri.findUnique({
				where: {
					id: parseInt(id_santri),
				},
			});

			const karakter = await prisma.ref_kriteria_karakter.findUnique({
				where: {
					id: id_kriteria,
				},
			});

			const existingNilai = await prisma.data_nilai_karakter.findUnique({
				where: {
					id_santri_id_tahun_ajaran_id_semester_id_kriteria_id_basis_lokasi_bulan_minggu:
						{
							id_santri: santri.id,
							id_tahun_ajaran: tahunAjaran.id,
							id_semester: semester.id,
							id_kriteria: id_kriteria,
							id_basis_lokasi: karakter.id_basis_lokasi,
							bulan: parseInt(bulan),
							minggu: parseInt(minggu),
						},
				},
			});

			if (!existingNilai) {
				const insertedNilai = await prisma.data_nilai_karakter.create({
					data: {
						bulan: parseInt(bulan),
						minggu: parseInt(minggu),
						id_santri: parseInt(id_santri),
						id_kriteria: parseInt(id_kriteria),
						nilai: parseFloat(nilai),
						id_basis_lokasi: karakter.id_basis_lokasi,
						id_semester: semester.id,
						id_tahun_ajaran: tahunAjaran.id,
					},
				});
				return res.status(201).json({
					success: true,
					message: "Nilai karakter berhasil ditambahkan",
					data: insertedNilai,
				});
			}

			const updatedNilai = await prisma.data_nilai_karakter.update({
				where: {
					id: existingNilai.id,
				},
				data: {
					nilai: parseFloat(nilai),
					// id_semester: semester.id,
					// id_tahun_ajaran: tahunAjaran.id,
				},
			});

			return res.status(200).json({
				success: true,
				message: "Nilai karakter berhasil diperbarui",
				data: updatedNilai,
			});
		} catch (error) {
			next(new AppError(error.message, 500));
		}
	};

	static uploadExcelFile = async (req, res, next) => {
		try {
			const { semester, tahunAjaran } = await getTokenPayload(req);
			const { pekan, bulan } = req.query;
			if (!pekan) {
				return next(new AppError("Query pekan tidak boleh kosong", 400));
			}

			if (!bulan) {
				return next(new AppError("Query bulan tidak boleh kosong", 400));
			}

			if (!req.file) {
				return next(new AppError("File tidak ditemukan", 400));
			}
			const data = await extractExcelData(req);

			if (!data || data.length === 0) {
				return next(new AppError("Data tidak ditemukan di file", 400));
			}

			const keys = Object.keys(data[0]);
			// hapus kolom nis dan nama dari keys
			// delete keys[keys.indexOf("nis")];
			// delete keys[keys.indexOf("nama")];

			const filteredKeys = keys.filter(
				(key) => key !== "nis" && key !== "nama"
			);

			const dictKarakter = await prisma.ref_kriteria_karakter.findMany({
				where: {
					is_aktif: true,
					nama: {
						in: filteredKeys.map((key) => key),
					},
				},
			});

			const karakterMap = dictKarakter.reduce((acc, item) => {
				acc[item.nama] = {
					id: item.id,
					basis_lokasi: item.id_basis_lokasi,
				};
				return acc;
			}, {});

			// console.log("keys", keys);
			const errorData = [];

			for (const item of data) {
				try {
					await prisma.$transaction(async (tx) => {
						const { nis, nama, ...nilai } = item;

						// cari santri berdasarkan nis
						const santri = await tx.santri.findFirst({
							where: {
								nis: nis.toString(),
								nama: nama.toString(),
							},
						});

						if (!santri) {
							throw new AppError(
								`Santri dengan NIS ${nis} tidak ditemukan`,
								404
							);
						}

						// for (const key in nilai) {
						for (const [key, value] of Object.entries(nilai)) {
							// console.log("key", key);
							// console.log("nilai[key]", nilai[key]);
							// console.log("karakterMap[key]", karakterMap[key]);

							if (nilai[key] === "") continue;
							// console.log("data", {
							// 	bulan: parseInt(bulan),
							// 			minggu: parseInt(pekan),
							// 			id_santri: santri.id,
							// 			nilai: parseInt(value),
							// 			id_semester: semester.id,
							// 			id_tahun_ajaran: tahunAjaran.id,
							// 			id_kriteria: karakterMap[key]
							// });
							// continue
							const existingNilai = await tx.data_nilai_karakter.findUnique({
								where: {
									id_santri_id_tahun_ajaran_id_semester_id_kriteria_id_basis_lokasi_bulan_minggu:
										{
											id_santri: santri.id,
											id_tahun_ajaran: tahunAjaran.id,
											id_semester: semester.id,
											id_kriteria: karakterMap[key].id,
											id_basis_lokasi: karakterMap[key].basis_lokasi,
											bulan: parseInt(bulan),
											minggu: parseInt(pekan),
										},
								},
							});
							if (existingNilai) {
								await tx.data_nilai_karakter.update({
									where: {
										id: existingNilai.id,
									},
									data: {
										nilai: parseInt(value),
										id_semester: semester.id,
										id_tahun_ajaran: tahunAjaran.id,
									},
								});
							} else {
								await tx.data_nilai_karakter.create({
									data: {
										bulan: parseInt(bulan),
										minggu: parseInt(pekan),
										id_santri: santri.id,
										nilai: parseInt(value),
										id_semester: semester.id,
										id_tahun_ajaran: tahunAjaran.id,
										id_kriteria: karakterMap[key].id,
										id_basis_lokasi: karakterMap[key].basis_lokasi,
									},
								});
							}
						}
						// cek apakah nilai sudah ada
					});
				} catch (error) {
					if (error instanceof AppError) {
						errorData.push({
							nis: item.nis,
							nama: item.nama,
							error: error.message,
						});
					} else {
						errorData.push({
							nis: item.nis,
							nama: item.nama,
							error: error.message || "Terjadi kesalahan saat memproses data",
						});
					}
				}
			}

			// console.log(data);
			// console.log(filePath);
			res.status(200).json({
				success: errorData.length === 0,
				message: errorData.length
					? "Beberapa data gagal diupload"
					: "Data berhasil diupload",
				errorData: errorData,
			});
		} catch (error) {
			next(new AppError(error.message, 500));
		}
	};
}
