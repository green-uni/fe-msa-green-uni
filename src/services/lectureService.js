import axios from './httpRequester';

const path = '/lectures'; 

class LectureService {

    // 강의 생성
    async postLecture(data) {
        const res = await axios.post(`${path}/create`, data);
        return res.data;
    }
    
    // 건물 목록 조회
    async getBuildings() {
        const res = await axios.get(`${path}/buildings`);
        return res.data.result; // 건물 이름 리스트 반환
    }

    // 강의실 목록 조회
    async getRoomNumber(params) {
        const res = await axios.get(`${path}/Roomlist`, { params });
        return res.data.result;
    }

    //내 강의 목록조회
    async getMyLecture() {
        const res = await axios.get(`${path}/my`);
        return res.data.result;
    }

    //강의 수정시 불러올 정보 조회
    async findByIdForEdit(id) {
        const res = await axios.get(`${path}/edit/${id}`);
        return res.data.result;
    }

    //강의 수정
    async editLecture(data) {
    const res = await axios.patch(`${path}/edit/${data.lectureId}`, data, {
        headers: { 'Content-Type': 'application/json' }
    });
    return res.data;
}

    //전체 강의조회
    async getLectureList() {
        const res = await axios.get(path);
        return res.data.result;
    }

    //강의 디테일(상세)
    async findById(id) {
        const res = await axios.get(`${path}/${id}`);
        return res.data.result;
    }

    //내 강의 수강학생목록
    async findByStudentInfo(id) {
        const res = await axios.get(`${path}/${id}/studentInfo`, {
            params: { lectureId: id }
        });
        return res.data.result;
    }

    //강의 상태 변경 (승인/반려)
    async updateLectureStatus(id, status) {
        const res = await axios.patch(`${path}/${id}/statusedit`, { status });
        return res.data.result;
    }

    //강의 삭제
    async deleteLecture(id) {
    const res = await axios.delete(`${path}/${id}`);
    return res.data;
}
}

export default new LectureService();